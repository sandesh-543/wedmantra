const db = require('../config/db');
const { CacheService, CACHE_TTL } = require('../services/cacheService');

const OrderModel = {
  async create(orderData) {
    // TODO: Implement order creation with items
    const result = await db.query(
      `INSERT INTO orders (order_number, user_id, subtotal, total_amount, shipping_full_name, shipping_phone, shipping_address_line1, shipping_city, shipping_state, shipping_pincode)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [orderData.order_number, orderData.user_id, orderData.subtotal, orderData.total_amount, orderData.shipping_full_name, orderData.shipping_phone, orderData.shipping_address_line1, orderData.shipping_city, orderData.shipping_state, orderData.shipping_pincode]
    );
    
    // Invalidate orders cache after creating new order
    await CacheService.del(CacheService.generateKey.orders(orderData.user_id));
    
    return result.rows[0];
  },
  
  async getByUser(userId) {
    const cacheKey = CacheService.generateKey.orders(userId);
    return await CacheService.cacheWrapper(cacheKey, async () => {
      const result = await db.query('SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
      return result.rows;
    }, CACHE_TTL.ORDERS);
  },
  
  async getById(id) {
    const cacheKey = CacheService.generateKey.order(id);
    return await CacheService.cacheWrapper(cacheKey, async () => {
      const result = await db.query('SELECT * FROM orders WHERE id = $1', [id]);
      return result.rows[0];
    }, CACHE_TTL.ORDERS);
  },
  
  async updateStatus(id, status) {
    const result = await db.query('UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *', [status, id]);
    
    // Invalidate order cache after status update
    await CacheService.del(CacheService.generateKey.order(id));
    if (result.rows[0]) {
      await CacheService.del(CacheService.generateKey.orders(result.rows[0].user_id));
    }
    
    return result.rows[0];
  },
  
  // TODO: Add order items methods
};

module.exports = OrderModel; 