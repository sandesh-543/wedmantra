const db = require('../config/db');
const { CacheService, CACHE_TTL } = require('../services/cacheService');

const BrandModel = {
  async getAll() {
    const cacheKey = 'brands:all';
    return await CacheService.cacheWrapper(cacheKey, async () => {
      const result = await db.query('SELECT * FROM brands WHERE is_active = true ORDER BY name');
      return result.rows;
    }, CACHE_TTL.CATEGORIES);
  },
  async getById(id) {
    const result = await db.query('SELECT * FROM brands WHERE id = $1', [id]);
    return result.rows[0];
  },
  async create(brand) {
    if (!brand.name || !brand.slug) throw new Error('Missing required brand fields');
    const result = await db.query(
      `INSERT INTO brands (name, slug, description, logo_url, is_active)
      VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [brand.name, brand.slug, brand.description, brand.logo_url, brand.is_active ?? true]
    );
    await CacheService.del('brands:all');
    return result.rows[0];
  },
  async update(id, brand) {
    if (!brand.name || !brand.slug) throw new Error('Missing required brand fields');
    const result = await db.query(
      `UPDATE brands SET name=$1, slug=$2, description=$3, logo_url=$4, is_active=$5, updated_at=NOW() WHERE id=$6 RETURNING *`,
      [brand.name, brand.slug, brand.description, brand.logo_url, brand.is_active ?? true, id]
    );
    await CacheService.del('brands:all');
    return result.rows[0];
  },
  async delete(id) {
    await db.query('DELETE FROM brands WHERE id = $1', [id]);
    await CacheService.del('brands:all');
    return { message: 'Brand deleted' };
  },
};

module.exports = BrandModel; 