const db = require('../config/db');
const { CacheService, CACHE_TTL } = require('../services/cacheService');

const BannerModel = {
  async getActiveBanners(now = new Date()) {
    const cacheKey = 'banners:active';
    return await CacheService.cacheWrapper(cacheKey, async () => {
      const result = await db.query(
        `SELECT * FROM banners WHERE is_active = true AND (start_date IS NULL OR start_date <= $1) AND (end_date IS NULL OR end_date >= $1) ORDER BY sort_order, id DESC`,
        [now]
      );
      return result.rows;
    }, CACHE_TTL.BANNERS);
  },
  async getById(id) {
    const result = await db.query('SELECT * FROM banners WHERE id = $1', [id]);
    return result.rows[0];
  },
  async create(banner) {
    if (!banner.title || !banner.image_url || !banner.banner_type) throw new Error('Missing required banner fields');
    const result = await db.query(
      `INSERT INTO banners (title, subtitle, description, image_url, mobile_image_url, banner_type, action_type, action_value, button_text, button_color, start_date, end_date, sort_order, is_active, show_on_mobile, show_on_web, created_by, created_at, updated_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,NOW(),NOW()) RETURNING *`,
      [banner.title, banner.subtitle, banner.description, banner.image_url, banner.mobile_image_url, banner.banner_type, banner.action_type, banner.action_value, banner.button_text, banner.button_color, banner.start_date, banner.end_date, banner.sort_order, banner.is_active ?? true, banner.show_on_mobile ?? true, banner.show_on_web ?? true, banner.created_by]
    );
    await CacheService.del('banners:active');
    return result.rows[0];
  },
  async update(id, banner) {
    if (!banner.title || !banner.image_url || !banner.banner_type) throw new Error('Missing required banner fields');
    const result = await db.query(
      `UPDATE banners SET title=$1, subtitle=$2, description=$3, image_url=$4, mobile_image_url=$5, banner_type=$6, action_type=$7, action_value=$8, button_text=$9, button_color=$10, start_date=$11, end_date=$12, sort_order=$13, is_active=$14, show_on_mobile=$15, show_on_web=$16, updated_at=NOW() WHERE id=$17 RETURNING *`,
      [banner.title, banner.subtitle, banner.description, banner.image_url, banner.mobile_image_url, banner.banner_type, banner.action_type, banner.action_value, banner.button_text, banner.button_color, banner.start_date, banner.end_date, banner.sort_order, banner.is_active ?? true, banner.show_on_mobile ?? true, banner.show_on_web ?? true, id]
    );
    await CacheService.del('banners:active');
    return result.rows[0];
  },
  async delete(id) {
    await db.query('DELETE FROM banners WHERE id = $1', [id]);
    await CacheService.del('banners:active');
    return { message: 'Banner deleted' };
  },
};

module.exports = BannerModel; 