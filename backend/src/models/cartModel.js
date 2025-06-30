const db = require('../config/db');
const { CacheService, CACHE_TTL } = require('../services/cacheService');

const CartModel = {
  async getCartByUser(userId) {
    const cacheKey = CacheService.generateKey.cart(userId);
    return await CacheService.cacheWrapper(cacheKey, async () => {
      const result = await db.query(
        `SELECT ci.*, p.name, p.price, p.sale_price, p.sku, p.image_url
         FROM cart_items ci
         JOIN products p ON ci.product_id = p.id
         WHERE ci.user_id = $1`, [userId]);
      return result.rows;
    }, CACHE_TTL.CART);
  },
  async addItem(userId, productId, quantity) {
    const result = await db.query(
      `INSERT INTO cart_items (user_id, product_id, quantity)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, product_id)
       DO UPDATE SET quantity = cart_items.quantity + $3, updated_at = NOW()
       RETURNING *`,
      [userId, productId, quantity]
    );
    
    // Invalidate cart cache after modification
    await CacheService.del(CacheService.generateKey.cart(userId));
    
    return result.rows[0];
  },
  async updateItem(itemId, quantity) {
    const result = await db.query(
      `UPDATE cart_items SET quantity = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [quantity, itemId]
    );
    
    // Invalidate cart cache after modification
    if (result.rows[0]) {
      await CacheService.invalidateCache('cart:*');
    }
    
    return result.rows[0];
  },
  async removeItem(itemId) {
    const item = await db.query('SELECT user_id FROM cart_items WHERE id = $1', [itemId]);
    await db.query('DELETE FROM cart_items WHERE id = $1', [itemId]);
    
    // Invalidate cart cache after modification
    if (item.rows[0]) {
      await CacheService.del(CacheService.generateKey.cart(item.rows[0].user_id));
    }
    
    return { message: 'Cart item removed' };
  },
};

module.exports = CartModel; 