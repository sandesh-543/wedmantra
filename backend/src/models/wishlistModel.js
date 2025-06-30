const db = require('../config/db');
const { CacheService, CACHE_TTL } = require('../services/cacheService');

const WishlistModel = {
  async getByUser(userId) {
    const cacheKey = CacheService.generateKey.wishlist(userId);
    return await CacheService.cacheWrapper(cacheKey, async () => {
      const result = await db.query(
        `SELECT wi.*, p.name, p.price, p.sale_price, p.sku, p.image_url
         FROM wishlist_items wi
         JOIN products p ON wi.product_id = p.id
         WHERE wi.user_id = $1`, [userId]);
      return result.rows;
    }, CACHE_TTL.WISHLIST);
  },
  async addItem(userId, productId) {
    const result = await db.query(
      `INSERT INTO wishlist_items (user_id, product_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, product_id) DO NOTHING
       RETURNING *`,
      [userId, productId]
    );
    
    // Invalidate wishlist cache after modification
    await CacheService.del(CacheService.generateKey.wishlist(userId));
    
    return result.rows[0];
  },
  async removeItem(userId, productId) {
    await db.query('DELETE FROM wishlist_items WHERE user_id = $1 AND product_id = $2', [userId, productId]);
    
    // Invalidate wishlist cache after modification
    await CacheService.del(CacheService.generateKey.wishlist(userId));
    
    return { message: 'Item removed from wishlist' };
  },
};

module.exports = WishlistModel; 