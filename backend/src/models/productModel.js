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
      `INSERT INTO products (
        name, slug, description, short_description, category_id, subcategory_id, brand_id, sku, price, sale_price, cost_price,
        fabric, work_type, occasion, region, length, blouse_piece, wash_care, stock_quantity, manage_stock, stock_status,
        meta_title, meta_description, status, featured, target_regions, festive_collection, created_by
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11,
        $12, $13, $14, $15, $16, $17, $18, $19, $20, $21,
        $22, $23, $24, $25, $26, $27, $28
      ) RETURNING *`,
      [
        product.name, product.slug, product.description, product.short_description, product.category_id, product.subcategory_id, product.brand_id, product.sku, product.price, product.sale_price, product.cost_price,
        product.fabric, product.work_type, product.occasion, product.region, product.length, product.blouse_piece, product.wash_care, product.stock_quantity, product.manage_stock, product.stock_status,
        product.meta_title, product.meta_description, product.status, product.featured, product.target_regions, product.festive_collection, product.created_by
      ]
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

  // Search and filter products
  async search({
    q, category_id, subcategory_id, brand_id, min_price, max_price, fabric, occasion, region, sort, page = 1, limit = 20
  }) {
    let where = [];
    let params = [];
    let idx = 1;
    if (q) {
      where.push(`(name ILIKE $${idx} OR description ILIKE $${idx})`);
      params.push(`%${q}%`);
      idx++;
    }
    if (category_id) {
      where.push(`category_id = $${idx}`);
      params.push(category_id);
      idx++;
    }
    if (subcategory_id) {
      where.push(`subcategory_id = $${idx}`);
      params.push(subcategory_id);
      idx++;
    }
    if (brand_id) {
      where.push(`brand_id = $${idx}`);
      params.push(brand_id);
      idx++;
    }
    if (min_price) {
      where.push(`price >= $${idx}`);
      params.push(min_price);
      idx++;
    }
    if (max_price) {
      where.push(`price <= $${idx}`);
      params.push(max_price);
      idx++;
    }
    if (fabric) {
      where.push(`fabric ILIKE $${idx}`);
      params.push(fabric);
      idx++;
    }
    if (occasion) {
      where.push(`occasion ILIKE $${idx}`);
      params.push(occasion);
      idx++;
    }
    if (region) {
      where.push(`region ILIKE $${idx}`);
      params.push(region);
      idx++;
    }
    let whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';
    // Sorting
    let orderBy = 'ORDER BY created_at DESC';
    if (sort === 'price_asc') orderBy = 'ORDER BY price ASC';
    else if (sort === 'price_desc') orderBy = 'ORDER BY price DESC';
    else if (sort === 'newest') orderBy = 'ORDER BY created_at DESC';
    // else default (relevance) is created_at DESC for MVP
    // Pagination
    const offset = (page - 1) * limit;
    // Total count
    const countResult = await db.query(`SELECT COUNT(*) FROM products ${whereClause}`, params);
    const total = parseInt(countResult.rows[0].count, 10);
    // Results
    const result = await db.query(
      `SELECT * FROM products ${whereClause} ${orderBy} OFFSET $${idx} LIMIT $${idx + 1}`,
      [...params, offset, limit]
    );
    return {
      total,
      products: result.rows
    };
  },
  async getBySKU(sku) {
    try {
      const result = await db.query('SELECT * FROM products WHERE sku = $1', [sku]);
      return result.rows[0];
    } catch (error) {
      console.error('Error fetching product by SKU:', error);
      throw error;
    }
},

// Get featured products
async getFeatured(limit = 10) {
  const cacheKey = `products:featured:${limit}`;
  return await CacheService.cacheWrapper(cacheKey, async () => {
    const result = await db.query(
      'SELECT * FROM products WHERE featured = true AND status = $1 ORDER BY created_at DESC LIMIT $2',
      ['active', limit]
    );
    return result.rows;
  }, CACHE_TTL.PRODUCTS);
},

// Get products by category
async getByCategory(categoryId, filters = {}) {
  let query = 'SELECT * FROM products WHERE category_id = $1 AND status = $2';
  const values = [categoryId, 'active'];
  let idx = 3;

  if (filters.min_price) {
    query += ` AND price >= $${idx++}`;
    values.push(filters.min_price);
  }
  if (filters.max_price) {
    query += ` AND price <= $${idx++}`;
    values.push(filters.max_price);
  }
  if (filters.fabric) {
    query += ` AND fabric ILIKE $${idx++}`;
    values.push(`%${filters.fabric}%`);
  }

  query += ' ORDER BY created_at DESC';
  
  if (filters.limit) {
    query += ` LIMIT $${idx++}`;
    values.push(filters.limit);
  }

  const result = await db.query(query, values);
  return result.rows;
},

// Update product status
async updateStatus(id, status) {
  const result = await db.query(
    'UPDATE products SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
    [status, id]
  );
  // Invalidate cache
  await CacheService.del(CacheService.generateKey.product(id));
  await CacheService.invalidateCache('products:*');
  return result.rows[0];
},

// Update stock quantity
async updateStock(id, quantity) {
  const result = await db.query(
    'UPDATE products SET stock_quantity = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
    [quantity, id]
  );
  // Invalidate cache
  await CacheService.del(CacheService.generateKey.product(id));
  return result.rows[0];
},
};

module.exports = ProductModel; 