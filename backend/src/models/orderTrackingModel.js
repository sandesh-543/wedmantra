const db = require('../config/db');
const { CacheService, CACHE_TTL } = require('../services/cacheService');

const OrderTrackingModel = {
  // Get order with full tracking details
  async getOrderWithTracking(orderId, userId = null) {
    const cacheKey = `order:tracking:${orderId}`;
    
    return await CacheService.cacheWrapper(cacheKey, async () => {
      let query = `
        SELECT 
          o.*,
          u.first_name,
          u.last_name,
          u.email,
          u.phone as user_phone,
          json_agg(
            json_build_object(
              'id', oi.id,
              'product_id', oi.product_id,
              'product_name', oi.product_name,
              'product_sku', oi.product_sku,
              'quantity', oi.quantity,
              'unit_price', oi.unit_price,
              'total_price', oi.total_price
            ) ORDER BY oi.id
          ) as items,
          json_agg(
            json_build_object(
              'status', osh.status,
              'notes', osh.notes,
              'created_at', osh.created_at,
              'created_by', osh.created_by
            ) ORDER BY osh.created_at
          ) FILTER (WHERE osh.id IS NOT NULL) as status_history
        FROM orders o
        LEFT JOIN users u ON o.user_id = u.id
        LEFT JOIN order_items oi ON o.id = oi.order_id
        LEFT JOIN order_status_history osh ON o.id = osh.order_id
        WHERE o.id = $1
      `;
      
      const params = [orderId];
      
      if (userId) {
        query += ' AND o.user_id = $2';
        params.push(userId);
      }
      
      query += ' GROUP BY o.id, u.first_name, u.last_name, u.email, u.phone';
      
      const result = await db.query(query, params);
      return result.rows[0];
    }, CACHE_TTL.ORDERS);
  },

  // Get order tracking by order number (public - no auth needed)
  async getTrackingByOrderNumber(orderNumber) {
    const cacheKey = `tracking:${orderNumber}`;
    
    return await CacheService.cacheWrapper(cacheKey, async () => {
      const result = await db.query(
        `SELECT 
          o.id,
          o.order_number,
          o.status,
          o.payment_status,
          o.total_amount,
          o.created_at,
          o.shipped_at,
          o.delivered_at,
          o.tracking_number,
          o.shipping_full_name,
          o.shipping_phone,
          o.shipping_city,
          o.shipping_state,
          json_agg(
            json_build_object(
              'status', osh.status,
              'notes', osh.notes,
              'created_at', osh.created_at
            ) ORDER BY osh.created_at
          ) FILTER (WHERE osh.id IS NOT NULL) as status_history
         FROM orders o
         LEFT JOIN order_status_history osh ON o.id = osh.order_id
         WHERE o.order_number = $1
         GROUP BY o.id`,
        [orderNumber]
      );
      return result.rows[0];
    }, CACHE_TTL.ORDERS);
  },

  // Update order status with tracking info
  async updateOrderStatus(orderId, statusData, updatedBy = null) {
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');

      const { status, notes, tracking_number, shipped_at, delivered_at } = statusData;

      // Update order
      let updateQuery = 'UPDATE orders SET status = $1, updated_at = NOW()';
      let updateParams = [status];
      let paramIndex = 2;

      if (tracking_number) {
        updateQuery += `, tracking_number = $${paramIndex++}`;
        updateParams.push(tracking_number);
      }

      if (shipped_at && status === 'shipped') {
        updateQuery += `, shipped_at = $${paramIndex++}`;
        updateParams.push(shipped_at);
      }

      if (delivered_at && status === 'delivered') {
        updateQuery += `, delivered_at = $${paramIndex++}`;
        updateParams.push(delivered_at);
      }

      updateQuery += ` WHERE id = $${paramIndex} RETURNING *`;
      updateParams.push(orderId);

      const orderResult = await client.query(updateQuery, updateParams);

      if (orderResult.rows.length === 0) {
        throw new Error('Order not found');
      }

      // Add status history
      await client.query(
        `INSERT INTO order_status_history (order_id, status, notes, created_by, created_at)
         VALUES ($1, $2, $3, $4, NOW())`,
        [orderId, status, notes || '', updatedBy]
      );

      await client.query('COMMIT');

      // Invalidate cache
      await CacheService.del(`order:tracking:${orderId}`);
      if (orderResult.rows[0].order_number) {
        await CacheService.del(`tracking:${orderResult.rows[0].order_number}`);
      }

      return orderResult.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  // Get delivery estimate
  async getDeliveryEstimate(orderId) {
    const result = await db.query(
      `SELECT 
        o.created_at,
        o.status,
        o.shipped_at,
        o.shipping_city,
        o.shipping_state,
        o.shipping_pincode
       FROM orders o
       WHERE o.id = $1`,
      [orderId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const order = result.rows[0];
    const now = new Date();
    
    // Simple delivery estimate logic (you can make this more sophisticated)
    let estimatedDays = 5; // Default 5 days
    
    // Adjust based on location (basic example)
    const majorCities = ['mumbai', 'delhi', 'bangalore', 'chennai', 'kolkata', 'hyderabad'];
    const city = order.shipping_city?.toLowerCase();
    
    if (majorCities.includes(city)) {
      estimatedDays = 3;
    } else if (order.shipping_state?.toLowerCase().includes('maharashtra')) {
      estimatedDays = 4;
    }

    // Calculate dates based on status
    let estimatedDelivery;
    
    if (order.status === 'delivered') {
      return {
        status: 'delivered',
        estimatedDelivery: null,
        actualDelivery: order.delivered_at
      };
    } else if (order.status === 'shipped' && order.shipped_at) {
      const shippedDate = new Date(order.shipped_at);
      estimatedDelivery = new Date(shippedDate.getTime() + (estimatedDays - 1) * 24 * 60 * 60 * 1000);
    } else {
      const orderDate = new Date(order.created_at);
      estimatedDelivery = new Date(orderDate.getTime() + estimatedDays * 24 * 60 * 60 * 1000);
    }

    return {
      status: order.status,
      estimatedDelivery,
      estimatedDays,
      actualDelivery: null
    };
  },

  // Get orders needing status update (for admin)
  async getOrdersNeedingUpdate() {
    const result = await db.query(
      `SELECT 
        o.id,
        o.order_number,
        o.status,
        o.created_at,
        o.shipping_full_name,
        o.total_amount,
        EXTRACT(days FROM NOW() - o.created_at) as days_old
       FROM orders o
       WHERE o.status IN ('pending', 'confirmed', 'processing', 'shipped')
       ORDER BY o.created_at ASC`
    );
    return result.rows;
  }
};

module.exports = OrderTrackingModel;