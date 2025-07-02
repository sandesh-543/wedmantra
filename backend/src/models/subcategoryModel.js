const db = require('../config/db');
const { CacheService, CACHE_TTL } = require('../services/cacheService');

const SubcategoryModel = {
  async getAll(categoryId = null) {
    const cacheKey = categoryId ? `subcategories:cat:${categoryId}` : 'subcategories:all';
    return await CacheService.cacheWrapper(cacheKey, async () => {
      let query = 'SELECT * FROM subcategories WHERE is_active = true';
      const values = [];
      if (categoryId) {
        query += ' AND category_id = $1';
        values.push(categoryId);
      }
      query += ' ORDER BY sort_order, name';
      const result = await db.query(query, values);
      return result.rows;
    }, CACHE_TTL.CATEGORIES);
  },
  async getById(id) {
    const result = await db.query('SELECT * FROM subcategories WHERE id = $1', [id]);
    return result.rows[0];
  },
  async create(subcategory) {
    if (!subcategory.name || !subcategory.slug || !subcategory.category_id) throw new Error('Missing required subcategory fields');
    const result = await db.query(
      `INSERT INTO subcategories (category_id, name, slug, description, image_url, sort_order, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [subcategory.category_id, subcategory.name, subcategory.slug, subcategory.description, subcategory.image_url, subcategory.sort_order, subcategory.is_active ?? true]
    );
    await CacheService.del('subcategories:all');
    await CacheService.del(`subcategories:cat:${subcategory.category_id}`);
    return result.rows[0];
  },
  async update(id, subcategory) {
    if (!subcategory.name || !subcategory.slug || !subcategory.category_id) throw new Error('Missing required subcategory fields');
    const result = await db.query(
      `UPDATE subcategories SET category_id=$1, name=$2, slug=$3, description=$4, image_url=$5, sort_order=$6, is_active=$7, updated_at=NOW() WHERE id=$8 RETURNING *`,
      [subcategory.category_id, subcategory.name, subcategory.slug, subcategory.description, subcategory.image_url, subcategory.sort_order, subcategory.is_active ?? true, id]
    );
    await CacheService.del('subcategories:all');
    await CacheService.del(`subcategories:cat:${subcategory.category_id}`);
    return result.rows[0];
  },
  async delete(id, categoryId) {
    await db.query('DELETE FROM subcategories WHERE id = $1', [id]);
    await CacheService.del('subcategories:all');
    if (categoryId) await CacheService.del(`subcategories:cat:${categoryId}`);
    return { message: 'Subcategory deleted' };
  },
};

module.exports = SubcategoryModel; 