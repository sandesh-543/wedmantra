const db = require('../config/db');
const { CacheService, CACHE_TTL } = require('../services/cacheService');

const ProductModel = {
  // Get all products (with optional filters)
  async getAll(filters = {}) {
    const cacheKey = CacheService.generateKey.products(JSON.stringify(filters));
    return await CacheService.cacheWrapper(cacheKey, async () => {
      let query = 'SELECT * FROM products';
      const values = [];
      const conditions = [];
      let idx = 1;
      // Filtering logic (category, brand, search, etc.)
      if (filters.category_id) {
        conditions.push(`category_id = $${idx++}`);
        values.push(filters.category_id);
      }
      if (filters.brand_id) {
        conditions.push(`brand_id = $${idx++}`);
        values.push(filters.brand_id);
      }
      if (filters.status) {
        conditions.push(`status = $${idx++}`);
        values.push(filters.status);
      }
      if (filters.search) {
        conditions.push(`LOWER(name) LIKE $${idx++}`);
        values.push(`%${filters.search.toLowerCase()}%`);
      }
      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }
      query += ' ORDER BY created_at DESC';
      const result = await db.query(query, values);
      return result.rows;
    }, CACHE_TTL.PRODUCTS);
  },

  // Get product by ID
  async getById(id) {
    const cacheKey = CacheService.generateKey.product(id);
    return await CacheService.cacheWrapper(cacheKey, async () => {
      const result = await db.query('SELECT * FROM products WHERE id = $1', [id]);
      return result.rows[0];
    }, CACHE_TTL.PRODUCTS);
  },

  // Create product
  async create(product) {
    // Basic validation
    if (!product.name || !product.slug || !product.sku || !product.price) {
      throw new Error('Missing required product fields');
    }
    const result = await db.query(
      `INSERT INTO products (name, slug, description, short_description, category_id, subcategory_id, brand_id, sku, price, sale_price, cost_price, fabric, work_type, occasion, region, length, blouse_piece, wash_care, stock_quantity, manage_stock, stock_status, meta_title, meta_description, status, featured, target_regions, festive_collection)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27) RETURNING *`,
      [product.name, product.slug, product.description, product.short_description, product.category_id, product.subcategory_id, product.brand_id, product.sku, product.price, product.sale_price, product.cost_price, product.fabric, product.work_type, product.occasion, product.region, product.length, product.blouse_piece, product.wash_care, product.stock_quantity, product.manage_stock, product.stock_status, product.meta_title, product.meta_description, product.status, product.featured, product.target_regions, product.festive_collection]
    );
    // Invalidate cache
    await CacheService.invalidateCache('products:*');
    await CacheService.invalidateCache('product:*');
    return result.rows[0];
  },

  // Update product
  async update(id, product) {
    // Basic validation
    if (!product.name || !product.slug || !product.sku || !product.price) {
      throw new Error('Missing required product fields');
    }
    const result = await db.query(
      `UPDATE products SET name=$1, slug=$2, description=$3, short_description=$4, category_id=$5, subcategory_id=$6, brand_id=$7, sku=$8, price=$9, sale_price=$10, cost_price=$11, fabric=$12, work_type=$13, occasion=$14, region=$15, length=$16, blouse_piece=$17, wash_care=$18, stock_quantity=$19, manage_stock=$20, stock_status=$21, meta_title=$22, meta_description=$23, status=$24, featured=$25, target_regions=$26, festive_collection=$27, updated_at=NOW() WHERE id=$28 RETURNING *`,
      [product.name, product.slug, product.description, product.short_description, product.category_id, product.subcategory_id, product.brand_id, product.sku, product.price, product.sale_price, product.cost_price, product.fabric, product.work_type, product.occasion, product.region, product.length, product.blouse_piece, product.wash_care, product.stock_quantity, product.manage_stock, product.stock_status, product.meta_title, product.meta_description, product.status, product.featured, product.target_regions, product.festive_collection, id]
    );
    // Invalidate cache
    await CacheService.del(CacheService.generateKey.product(id));
    await CacheService.invalidateCache('products:*');
    return result.rows[0];
  },

  // Delete product
  async delete(id) {
    await db.query('DELETE FROM products WHERE id = $1', [id]);
    // Invalidate cache
    await CacheService.del(CacheService.generateKey.product(id));
    await CacheService.invalidateCache('products:*');
    return { message: 'Product deleted' };
  },

  // Product media
  async getMedia(productId) {
    const result = await db.query('SELECT * FROM product_media WHERE product_id = $1 ORDER BY sort_order ASC, id ASC', [productId]);
    return result.rows;
  },
  async addMedia(productId, media) {
    if (!media.media_url || !media.media_type) {
      throw new Error('Missing required media fields');
    }
    const result = await db.query(
      `INSERT INTO product_media (product_id, media_url, media_type, thumbnail_url, alt_text, sort_order, is_primary, file_size, duration)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [productId, media.media_url, media.media_type, media.thumbnail_url, media.alt_text, media.sort_order, media.is_primary, media.file_size, media.duration]
    );
    // Invalidate product cache
    await CacheService.del(CacheService.generateKey.product(productId));
    return result.rows[0];
  },
  async deleteMedia(mediaId) {
    const result = await db.query('DELETE FROM product_media WHERE id = $1 RETURNING product_id', [mediaId]);
    if (result.rows[0]) {
      await CacheService.del(CacheService.generateKey.product(result.rows[0].product_id));
    }
    return { message: 'Media deleted' };
  },

  // Product attributes
  async getAttributes(productId) {
    const result = await db.query('SELECT * FROM product_attributes WHERE product_id = $1', [productId]);
    return result.rows;
  },
  async addAttribute(productId, attribute) {
    if (!attribute.attribute_name || !attribute.attribute_value) {
      throw new Error('Missing required attribute fields');
    }
    const result = await db.query(
      `INSERT INTO product_attributes (product_id, attribute_name, attribute_value)
      VALUES ($1, $2, $3) RETURNING *`,
      [productId, attribute.attribute_name, attribute.attribute_value]
    );
    // Invalidate product cache
    await CacheService.del(CacheService.generateKey.product(productId));
    return result.rows[0];
  },
  async deleteAttribute(attributeId) {
    const result = await db.query('DELETE FROM product_attributes WHERE id = $1 RETURNING product_id', [attributeId]);
    if (result.rows[0]) {
      await CacheService.del(CacheService.generateKey.product(result.rows[0].product_id));
    }
    return { message: 'Attribute deleted' };
  },
};

module.exports = ProductModel; 