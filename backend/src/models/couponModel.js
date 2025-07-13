const db = require('../config/db');
const { CacheService, CACHE_TTL } = require('../services/cacheService');

const CouponModel = {
  async getByCode(code) {
    const cacheKey = `coupon:${code}`;
    return await CacheService.cacheWrapper(cacheKey, async () => {
      const result = await db.query('SELECT * FROM coupons WHERE code = $1', [code]);
      return result.rows[0];
    }, CACHE_TTL.COUPONS);
  },
  async getById(id) {
    const result = await db.query('SELECT * FROM coupons WHERE id = $1', [id]);
    return result.rows[0];
  },
  async getAllActive(now = new Date()) {
    const cacheKey = 'coupons:active';
    return await CacheService.cacheWrapper(cacheKey, async () => {
      const result = await db.query(
        'SELECT * FROM coupons WHERE is_active = true AND valid_from <= $1 AND valid_until >= $1',
        [now]
      );
      return result.rows;
    }, CACHE_TTL.COUPONS);
  },
  async create(coupon) {
    const result = await db.query(
      `INSERT INTO coupons (code, name, description, type, value, minimum_amount, maximum_discount, usage_limit, valid_from, valid_until, is_active, created_at, updated_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,NOW(),NOW()) RETURNING *`,
      [coupon.code, coupon.name, coupon.description, coupon.type, coupon.value, coupon.minimum_amount, coupon.maximum_discount, coupon.usage_limit, coupon.valid_from, coupon.valid_until, coupon.is_active ?? true]
    );
    await CacheService.del('coupons:active');
    await CacheService.del(`coupon:${coupon.code}`);
    return result.rows[0];
  },
  async update(id, coupon) {
    const result = await db.query(
      `UPDATE coupons SET code=$1, name=$2, description=$3, type=$4, value=$5, minimum_amount=$6, maximum_discount=$7, usage_limit=$8, valid_from=$9, valid_until=$10, is_active=$11, updated_at=NOW() WHERE id=$12 RETURNING *`,
      [coupon.code, coupon.name, coupon.description, coupon.type, coupon.value, coupon.minimum_amount, coupon.maximum_discount, coupon.usage_limit, coupon.valid_from, coupon.valid_until, coupon.is_active ?? true, id]
    );
    await CacheService.del('coupons:active');
    await CacheService.del(`coupon:${coupon.code}`);
    return result.rows[0];
  },
  async delete(id, code) {
    await db.query('DELETE FROM coupons WHERE id = $1', [id]);
    await CacheService.del('coupons:active');
    if (code) await CacheService.del(`coupon:${code}`);
    return { message: 'Coupon deleted' };
  },
  // Coupon usage
  async getUsageByUser(couponId, userId) {
    const result = await db.query('SELECT COUNT(*) FROM coupon_usage WHERE coupon_id = $1 AND user_id = $2', [couponId, userId]);
    return parseInt(result.rows[0].count, 10);
  },
  async getTotalUsage(couponId) {
    const result = await db.query('SELECT COUNT(*) FROM coupon_usage WHERE coupon_id = $1', [couponId]);
    return parseInt(result.rows[0].count, 10);
  },
  async addUsage(couponId, userId, orderId, discountAmount) {
    await db.query(
      `INSERT INTO coupon_usage (coupon_id, user_id, order_id, discount_amount, used_at)
      VALUES ($1, $2, $3, $4, NOW())`,
      [couponId, userId, orderId, discountAmount]
    );
  },
  // Get all coupons (for admin)
  async getAll() {
    try {
      const result = await db.query(
        'SELECT *, (used_count::float / NULLIF(usage_limit, 0) * 100) as usage_percentage FROM coupons ORDER BY created_at DESC'
      );
      return result.rows;
    } catch (error) {
      console.error('Error fetching all coupons:', error);
      throw error;
    }
  },

  // Get coupon usage statistics
  async getUsageStats(couponId) {
    try {
      const result = await db.query(
        `SELECT 
          COUNT(*) as total_uses,
          SUM(discount_amount) as total_discount,
          COUNT(DISTINCT user_id) as unique_users
        FROM coupon_usage 
        WHERE coupon_id = $1`,
        [couponId]
      );
      return result.rows[0];
      } catch (error) {
      console.error('Error fetching coupon usage stats:', error);
      throw error;
    }
  },
};

module.exports = CouponModel; 