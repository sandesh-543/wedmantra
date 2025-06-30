const db = require('../config/db');
const { CacheService, CACHE_TTL } = require('../services/cacheService');

const ProductModel = {
  async getAll() {
    const cacheKey = CacheService.generateKey.products();
    return await CacheService.cacheWrapper(cacheKey, async () => {
      const result = await db.query('SELECT * FROM products');
      return result.rows;
    }, CACHE_TTL.PRODUCTS);
  },
  async getById(id) {
    const cacheKey = CacheService.generateKey.product(id);
    return await CacheService.cacheWrapper(cacheKey, async () => {
      const result = await db.query('SELECT * FROM products WHERE id = $1', [id]);
      return result.rows[0];
    }, CACHE_TTL.PRODUCTS);
  },
  async create(product) {
    const result = await db.query(
      `INSERT INTO products (name, slug, description, short_description, category_id, subcategory_id, brand_id, sku, price, sale_price, cost_price, fabric, work_type, occasion, region, length, blouse_piece, wash_care, stock_quantity, manage_stock, stock_status, meta_title, meta_description, status, featured, target_regions, festive_collection)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27) RETURNING *`,
      [product.name, product.slug, product.description, product.short_description, product.category_id, product.subcategory_id, product.brand_id, product.sku, product.price, product.sale_price, product.cost_price, product.fabric, product.work_type, product.occasion, product.region, product.length, product.blouse_piece, product.wash_care, product.stock_quantity, product.manage_stock, product.stock_status, product.meta_title, product.meta_description, product.status, product.featured, product.target_regions, product.festive_collection]
    );
    
    // Invalidate cache after creating new product
    await CacheService.invalidateCache('products:*');
    await CacheService.invalidateCache('product:*');
    
    return result.rows[0];
  }, 
  async update(id, product) {
    const result = await db.query(
      `UPDATE products SET name=$1, slug=$2, description=$3, short_description=$4, category_id=$5, subcategory_id=$6, brand_id=$7, sku=$8, price=$9, sale_price=$10, cost_price=$11, fabric=$12, work_type=$13, occasion=$14, region=$15, length=$16, blouse_piece=$17, wash_care=$18, stock_quantity=$19, manage_stock=$20, stock_status=$21, meta_title=$22, meta_description=$23, status=$24, featured=$25, target_regions=$26, festive_collection=$27, updated_at=NOW() WHERE id=$28 RETURNING *`,
      [product.name, product.slug, product.description, product.short_description, product.category_id, product.subcategory_id, product.brand_id, product.sku, product.price, product.sale_price, product.cost_price, product.fabric, product.work_type, product.occasion, product.region, product.length, product.blouse_piece, product.wash_care, product.stock_quantity, product.manage_stock, product.stock_status, product.meta_title, product.meta_description, product.status, product.featured, product.target_regions, product.festive_collection, id]
    );
    
    // Invalidate cache after updating product
    await CacheService.del(CacheService.generateKey.product(id));
    await CacheService.invalidateCache('products:*');
    
    return result.rows[0];
  },
  async delete(id) {
    await db.query('DELETE FROM products WHERE id = $1', [id]);
    
    // Invalidate cache after deleting product
    await CacheService.del(CacheService.generateKey.product(id));
    await CacheService.invalidateCache('products:*');
    
    return { message: 'Product deleted' };
  },
  // Media and attributes methods would be added here
};

module.exports = ProductModel; 