const db = require('../config/db');
const { CacheService, CACHE_TTL } = require('../services/cacheService');

const CategoryModel = {
  async getAll() {
    const cacheKey = CacheService.generateKey.categories();
    return await CacheService.cacheWrapper(cacheKey, async () => {
      const result = await db.query('SELECT * FROM categories WHERE is_active = true ORDER BY sort_order, name');
      return result.rows;
    }, CACHE_TTL.CATEGORIES);
  },
  async getById(id) {
    const result = await db.query('SELECT * FROM categories WHERE id = $1', [id]);
    return result.rows[0];
  },
  async create(category) {
    if (!category.name || !category.slug) throw new Error('Missing required category fields');
    const result = await db.query(
      `INSERT INTO categories (name, slug, description, image_url, parent_id, sort_order, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [category.name, category.slug, category.description, category.image_url, category.parent_id, category.sort_order, category.is_active ?? true]
    );
    await CacheService.del(CacheService.generateKey.categories());
    return result.rows[0];
  },
  async update(id, category) {
    if (!category.name || !category.slug) throw new Error('Missing required category fields');
    const result = await db.query(
      `UPDATE categories SET name=$1, slug=$2, description=$3, image_url=$4, parent_id=$5, sort_order=$6, is_active=$7, updated_at=NOW() WHERE id=$8 RETURNING *`,
      [category.name, category.slug, category.description, category.image_url, category.parent_id, category.sort_order, category.is_active ?? true, id]
    );
    await CacheService.del(CacheService.generateKey.categories());
    return result.rows[0];
  },
  async delete(id) {
    await db.query('DELETE FROM categories WHERE id = $1', [id]);
    await CacheService.del(CacheService.generateKey.categories());
    return { message: 'Category deleted' };
  },
};

module.exports = CategoryModel; 