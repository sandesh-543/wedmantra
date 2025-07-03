const db = require('../config/db');
const { CacheService, CACHE_TTL } = require('../services/cacheService');

const OrderModel = {
  async create(orderData) {
    const client = await db.connect();
    try {
      await client.query('BEGIN');
      
      // Create order
      const orderResult = await client.query(
        `INSERT INTO orders (order_number, user_id, subtotal, total_amount, shipping_full_name, shipping_phone, shipping_address_line1, shipping_city, shipping_state, shipping_pincode, payment_method, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
        [orderData.order_number, orderData.user_id, orderData.subtotal, orderData.total_amount, orderData.shipping_full_name, orderData.shipping_phone, orderData.shipping_address_line1, orderData.shipping_city, orderData.shipping_state, orderData.shipping_pincode, orderData.payment_method || 'cod', 'pending']
      );
      
      const order = orderResult.rows[0];
      
      // Create order items
      if (orderData.items && Array.isArray(orderData.items)) {
        for (const item of orderData.items) {
          await client.query(
            `INSERT INTO order_items (order_id, product_id, quantity, price, total_price)
             VALUES ($1, $2, $3, $4, $5)`,
            [order.id, item.product_id, item.quantity, item.price, item.total_price]
          );
        }
      }
      
      // Create initial status history
      await client.query(
        `INSERT INTO order_status_history (order_id, status, notes, created_at)
         VALUES ($1, $2, $3, NOW())`,
        [order.id, 'pending', 'Order created']
      );
      
      await client.query('COMMIT');
      
      // Invalidate orders cache after creating new order
      await CacheService.del(CacheService.generateKey.orders(orderData.user_id));
      
      return order;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },
  
  async getByUser(userId) {
    const cacheKey = CacheService.generateKey.orders(userId);
    return await CacheService.cacheWrapper(cacheKey, async () => {
      const result = await db.query(
        `SELECT o.*, 
                json_agg(json_build_object(
                  'id', oi.id,
                  'product_id', oi.product_id,
                  'quantity', oi.quantity,
                  'price', oi.price,
                  'total_price', oi.total_price
                )) as items
         FROM orders o
         LEFT JOIN order_items oi ON o.id = oi.order_id
         WHERE o.user_id = $1
         GROUP BY o.id
         ORDER BY o.created_at DESC`,
        [userId]
      );
      return result.rows;
    }, CACHE_TTL.ORDERS);
  },
  
  async getById(id) {
    const result = await db.query(
      `SELECT o.*, 
              json_agg(json_build_object(
                'id', oi.id,
                'product_id', oi.product_id,
                'quantity', oi.quantity,
                'price', oi.price,
                'total_price', oi.total_price
              )) as items,
              json_agg(json_build_object(
                'status', osh.status,
                'notes', osh.notes,
                'created_at', osh.created_at
              )) as status_history
       FROM orders o
       LEFT JOIN order_items oi ON o.id = oi.order_id
       LEFT JOIN order_status_history osh ON o.id = osh.order_id
       WHERE o.id = $1
       GROUP BY o.id`,
      [id]
    );
    return result.rows[0];
  },
  
  async updateStatus(id, status, notes = '') {
    const client = await db.connect();
    try {
      await client.query('BEGIN');
      
      // Update order status
      const result = await client.query(
        'UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
        [status, id]
      );
      
      // Add status history
      await client.query(
        `INSERT INTO order_status_history (order_id, status, notes, created_at)
         VALUES ($1, $2, $3, NOW())`,
        [id, status, notes]
      );
      
      await client.query('COMMIT');
      
      // Invalidate cache
      if (result.rows[0]) {
        await CacheService.del(CacheService.generateKey.orders(result.rows[0].user_id));
      }
      
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },
  
  // Order items methods
  async getOrderItems(orderId) {
    const result = await db.query(
      `SELECT oi.*, p.name as product_name, p.image_url
       FROM order_items oi
       JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = $1`,
      [orderId]
    );
    return result.rows;
  },

  async addOrderItem(orderId, itemData) {
    const result = await db.query(
      `INSERT INTO order_items (order_id, product_id, quantity, price, total_price)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [orderId, itemData.product_id, itemData.quantity, itemData.price, itemData.total_price]
    );
    return result.rows[0];
  },

  async updateOrderItem(itemId, updates) {
    const result = await db.query(
      `UPDATE order_items 
       SET quantity = $1, price = $2, total_price = $3, updated_at = NOW()
       WHERE id = $4 RETURNING *`,
      [updates.quantity, updates.price, updates.total_price, itemId]
    );
    return result.rows[0];
  },

  async removeOrderItem(itemId) {
    const result = await db.query(
      'DELETE FROM order_items WHERE id = $1 RETURNING *',
      [itemId]
    );
    return result.rows[0];
  }
};

module.exports = OrderModel; 