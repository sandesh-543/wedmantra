const db = require('../config/db');
const { CacheService, CACHE_TTL } = require('../services/cacheService');

const ProductModel = {
  // Get all products with pagination and soft delete support
  async getAll(filters = {}) {
    const page = parseInt(filters.page) || 1;
    const limit = Math.min(parseInt(filters.limit) || 20, 100); // Max 100 items
    const offset = (page - 1) * limit;
    
    // Create cache key including pagination
    const cacheKey = CacheService.generateKey.products({
      ...filters,
      page,
      limit
    });
    
    return await CacheService.cacheWrapper(cacheKey, async () => {
      let query = `
        SELECT p.*, c.name as category_name, b.name as brand_name,
               pm.media_url as image_url,
               COUNT(*) OVER() as total_count
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN brands b ON p.brand_id = b.id
        LEFT JOIN product_media pm ON p.id = pm.product_id AND pm.is_primary = true
        WHERE p.deleted_at IS NULL AND p.status = 'active'
      `;
      
      const queryParams = [];
      let paramIndex = 1;

      // Add filter conditions
      if (filters.category_id) {
        query += ` AND p.category_id = $${paramIndex++}`;
        queryParams.push(filters.category_id);
      }
      if (filters.subcategory_id) {
        query += ` AND p.subcategory_id = $${paramIndex++}`;
        queryParams.push(filters.subcategory_id);
      }
      if (filters.brand_id) {
        query += ` AND p.brand_id = $${paramIndex++}`;
        queryParams.push(filters.brand_id);
      }
      if (filters.min_price) {
        query += ` AND p.price >= $${paramIndex++}`;
        queryParams.push(filters.min_price);
      }
      if (filters.max_price) {
        query += ` AND p.price <= $${paramIndex++}`;
        queryParams.push(filters.max_price);
      }
      if (filters.fabric) {
        query += ` AND p.fabric ILIKE $${paramIndex++}`;
        queryParams.push(`%${filters.fabric}%`);
      }
      if (filters.occasion) {
        query += ` AND p.occasion ILIKE $${paramIndex++}`;
        queryParams.push(`%${filters.occasion}%`);
      }
      if (filters.region) {
        query += ` AND p.region ILIKE $${paramIndex++}`;
        queryParams.push(`%${filters.region}%`);
      }
      if (filters.featured) {
        query += ` AND p.featured = $${paramIndex++}`;
        queryParams.push(filters.featured);
      }
      if (filters.search) {
        query += ` AND (p.name ILIKE $${paramIndex} OR p.description ILIKE $${paramIndex})`;
        queryParams.push(`%${filters.search}%`);
        paramIndex++;
      }

      // Add sorting
      const sortBy = filters.sort || 'created_at';
      const sortOrder = filters.order || 'DESC';
      
      // Validate sort column to prevent SQL injection
      const allowedSortColumns = ['created_at', 'price', 'name', 'featured'];
      const safeSortBy = allowedSortColumns.includes(sortBy) ? sortBy : 'created_at';
      const safeSortOrder = ['ASC', 'DESC'].includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';
      
      query += ` ORDER BY p.${safeSortBy} ${safeSortOrder}`;

      // Add pagination
      query += ` LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
      queryParams.push(limit, offset);

      const result = await db.query(query, queryParams);
      
      const totalCount = result.rows.length > 0 ? parseInt(result.rows[0].total_count) : 0;
      const totalPages = Math.ceil(totalCount / limit);
      
      return {
        products: result.rows.map(row => {
          const { total_count, ...product } = row;
          return product;
        }),
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      };
    }, CACHE_TTL.PRODUCTS);
  },

  // Get product by ID (excluding soft deleted)
  async getById(id, includeDeleted = false) {
    const cacheKey = CacheService.generateKey.product(id);
    return await CacheService.cacheWrapper(cacheKey, async () => {
      let query = 'SELECT * FROM products WHERE id = $1';
      const params = [id];
      
      if (!includeDeleted) {
        query += ' AND deleted_at IS NULL';
      }
      
      const result = await db.query(query, params);
      return result.rows[0];
    }, CACHE_TTL.PRODUCTS);
  },

  // Create product (unchanged)
  async create(product) {
    if (!product.name || !product.slug || !product.sku || !product.price) {
      throw new Error('Missing required product fields');
    }
    
    const result = await db.query(
      `INSERT INTO products (
        name, slug, description, short_description, category_id, subcategory_id, brand_id, sku, price, sale_price, cost_price,
        fabric, work_type, occasion, region, length, blouse_piece, wash_care, stock_quantity, manage_stock, stock_status,
        meta_title, meta_description, status, featured, target_regions, festive_collection, created_by, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11,
        $12, $13, $14, $15, $16, $17, $18, $19, $20, $21,
        $22, $23, $24, $25, $26, $27, $28, NOW(), NOW()
      ) RETURNING *`,
      [
        product.name, product.slug, product.description, product.short_description, product.category_id, product.subcategory_id, product.brand_id, product.sku, product.price, product.sale_price, product.cost_price,
        product.fabric, product.work_type, product.occasion, product.region, product.length, product.blouse_piece, product.wash_care, product.stock_quantity || 0, product.manage_stock !== false, product.stock_status || 'in_stock',
        product.meta_title, product.meta_description, product.status || 'active', product.featured || false, product.target_regions, product.festive_collection, product.created_by
      ]
    );
    
    // Invalidate cache
    await CacheService.invalidateCache('products:*');
    await CacheService.invalidateCache('product:*');
    return result.rows[0];
  },

  // Update product (unchanged)
  async update(id, product) {
    if (!product.name || !product.slug || !product.sku || !product.price) {
      throw new Error('Missing required product fields');
    }
    
    const result = await db.query(
      `UPDATE products SET name=$1, slug=$2, description=$3, short_description=$4, category_id=$5, subcategory_id=$6, brand_id=$7, sku=$8, price=$9, sale_price=$10, cost_price=$11, fabric=$12, work_type=$13, occasion=$14, region=$15, length=$16, blouse_piece=$17, wash_care=$18, stock_quantity=$19, manage_stock=$20, stock_status=$21, meta_title=$22, meta_description=$23, status=$24, featured=$25, target_regions=$26, festive_collection=$27, updated_at=NOW() WHERE id=$28 AND deleted_at IS NULL RETURNING *`,
      [product.name, product.slug, product.description, product.short_description, product.category_id, product.subcategory_id, product.brand_id, product.sku, product.price, product.sale_price, product.cost_price, product.fabric, product.work_type, product.occasion, product.region, product.length, product.blouse_piece, product.wash_care, product.stock_quantity, product.manage_stock, product.stock_status, product.meta_title, product.meta_description, product.status, product.featured, product.target_regions, product.festive_collection, id]
    );
    
    // Invalidate cache
    await CacheService.del(CacheService.generateKey.product(id));
    await CacheService.invalidateCache('products:*');
    return result.rows[0];
  },

  // Soft delete product
  async softDelete(id) {
    const result = await db.query(
      'UPDATE products SET deleted_at = NOW(), updated_at = NOW() WHERE id = $1 AND deleted_at IS NULL RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      throw new Error('Product not found or already deleted');
    }
    
    // Invalidate cache
    await CacheService.del(CacheService.generateKey.product(id));
    await CacheService.invalidateCache('products:*');
    return result.rows[0];
  },

  // Restore soft deleted product
  async restore(id) {
    const result = await db.query(
      'UPDATE products SET deleted_at = NULL, updated_at = NOW() WHERE id = $1 AND deleted_at IS NOT NULL RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      throw new Error('Product not found or not deleted');
    }
    
    // Invalidate cache
    await CacheService.del(CacheService.generateKey.product(id));
    await CacheService.invalidateCache('products:*');
    return result.rows[0];
  },

  // Hard delete product (permanent deletion)
  async delete(id) {
    await db.query('DELETE FROM products WHERE id = $1', [id]);
    
    // Invalidate cache
    await CacheService.del(CacheService.generateKey.product(id));
    await CacheService.invalidateCache('products:*');
    return { message: 'Product permanently deleted' };
  },

  // Get all products including soft deleted (admin only)
  async getAllWithDeleted(filters = {}) {
    const page = parseInt(filters.page) || 1;
    const limit = Math.min(parseInt(filters.limit) || 20, 100);
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT p.*, c.name as category_name, b.name as brand_name,
             pm.media_url as image_url,
             COUNT(*) OVER() as total_count,
             CASE WHEN p.deleted_at IS NOT NULL THEN true ELSE false END as is_deleted
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN brands b ON p.brand_id = b.id
      LEFT JOIN product_media pm ON p.id = pm.product_id AND pm.is_primary = true
      WHERE 1=1
    `;
    
    const queryParams = [];
    let paramIndex = 1;

    // Add filter for deleted status
    if (filters.deleted === 'true') {
      query += ` AND p.deleted_at IS NOT NULL`;
    } else if (filters.deleted === 'false') {
      query += ` AND p.deleted_at IS NULL`;
    }
    // If no deleted filter, show all

    // Add other filters...
    if (filters.category_id) {
      query += ` AND p.category_id = $${paramIndex++}`;
      queryParams.push(filters.category_id);
    }

    // Add sorting
    const sortBy = filters.sort || 'created_at';
    const sortOrder = filters.order || 'DESC';
    const allowedSortColumns = ['created_at', 'price', 'name', 'featured', 'deleted_at'];
    const safeSortBy = allowedSortColumns.includes(sortBy) ? sortBy : 'created_at';
    const safeSortOrder = ['ASC', 'DESC'].includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';
    
    query += ` ORDER BY p.${safeSortBy} ${safeSortOrder}`;

    // Add pagination
    query += ` LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    queryParams.push(limit, offset);

    const result = await db.query(query, queryParams);
    
    const totalCount = result.rows.length > 0 ? parseInt(result.rows[0].total_count) : 0;
    const totalPages = Math.ceil(totalCount / limit);
    
    return {
      products: result.rows.map(row => {
        const { total_count, ...product } = row;
        return product;
      }),
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    };
  },

  // Get only soft deleted products
  async getDeleted(filters = {}) {
    const page = parseInt(filters.page) || 1;
    const limit = Math.min(parseInt(filters.limit) || 20, 100);
    const offset = (page - 1) * limit;
    
    const query = `
      SELECT p.*, c.name as category_name, b.name as brand_name,
             COUNT(*) OVER() as total_count
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN brands b ON p.brand_id = b.id
      WHERE p.deleted_at IS NOT NULL
      ORDER BY p.deleted_at DESC
      LIMIT $1 OFFSET $2
    `;
    
    const result = await db.query(query, [limit, offset]);
    
    const totalCount = result.rows.length > 0 ? parseInt(result.rows[0].total_count) : 0;
    const totalPages = Math.ceil(totalCount / limit);
    
    return {
      products: result.rows.map(row => {
        const { total_count, ...product } = row;
        return product;
      }),
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    };
  },

  // Search products with pagination and soft delete support
  async search({
    q, category_id, subcategory_id, brand_id, min_price, max_price, fabric, occasion, region, sort, page = 1, limit = 20
  }) {
    const pageNum = parseInt(page);
    const limitNum = Math.min(parseInt(limit), 100);
    const offset = (pageNum - 1) * limitNum;
    
    let where = ['p.deleted_at IS NULL', 'p.status = \'active\''];
    let params = [];
    let idx = 1;
    
    if (q) {
      where.push(`(p.name ILIKE $${idx} OR p.description ILIKE $${idx})`);
      params.push(`%${q}%`);
      idx++;
    }
    if (category_id) {
      where.push(`p.category_id = $${idx}`);
      params.push(category_id);
      idx++;
    }
    if (subcategory_id) {
      where.push(`p.subcategory_id = $${idx}`);
      params.push(subcategory_id);
      idx++;
    }
    if (brand_id) {
      where.push(`p.brand_id = $${idx}`);
      params.push(brand_id);
      idx++;
    }
    if (min_price) {
      where.push(`p.price >= $${idx}`);
      params.push(min_price);
      idx++;
    }
    if (max_price) {
      where.push(`p.price <= $${idx}`);
      params.push(max_price);
      idx++;
    }
    if (fabric) {
      where.push(`p.fabric ILIKE $${idx}`);
      params.push(`%${fabric}%`);
      idx++;
    }
    if (occasion) {
      where.push(`p.occasion ILIKE $${idx}`);
      params.push(`%${occasion}%`);
      idx++;
    }
    if (region) {
      where.push(`p.region ILIKE $${idx}`);
      params.push(`%${region}%`);
      idx++;
    }
    
    const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';
    
    // Sorting
    let orderBy = 'ORDER BY p.created_at DESC';
    if (sort === 'price_asc') orderBy = 'ORDER BY p.price ASC';
    else if (sort === 'price_desc') orderBy = 'ORDER BY p.price DESC';
    else if (sort === 'newest') orderBy = 'ORDER BY p.created_at DESC';
    else if (sort === 'name_asc') orderBy = 'ORDER BY p.name ASC';
    else if (sort === 'name_desc') orderBy = 'ORDER BY p.name DESC';
    
    // Total count
    const countResult = await db.query(
      `SELECT COUNT(*) FROM products p ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count, 10);
    
    // Results with pagination
    const result = await db.query(
      `SELECT p.*, c.name as category_name, b.name as brand_name,
              pm.media_url as image_url
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       LEFT JOIN brands b ON p.brand_id = b.id
       LEFT JOIN product_media pm ON p.id = pm.product_id AND pm.is_primary = true
       ${whereClause} ${orderBy} 
       LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, limitNum, offset]
    );
    
    const totalPages = Math.ceil(total / limitNum);
    
    return {
      total,
      products: result.rows,
      pagination: {
        page: pageNum,
        limit: limitNum,
        pages: totalPages,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1
      }
    };
  },

  // Other existing methods remain the same...
  async getMedia(productId) {
    const result = await db.query('SELECT * FROM product_media WHERE product_id = $1 ORDER BY sort_order ASC, id ASC', [productId]);
    return result.rows;
  },

  async addMedia(productId, media) {
    if (!media.media_url || !media.media_type) {
      throw new Error('Missing required media fields');
    }
    const result = await db.query(
      `INSERT INTO product_media (product_id, media_url, media_type, thumbnail_url, alt_text, sort_order, is_primary, file_size, duration, created_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW()) RETURNING *`,
      [productId, media.media_url, media.media_type, media.thumbnail_url, media.alt_text, media.sort_order || 0, media.is_primary || false, media.file_size, media.duration]
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

  async getAttributes(productId) {
    const result = await db.query('SELECT * FROM product_attributes WHERE product_id = $1', [productId]);
    return result.rows;
  },

  async addAttribute(productId, attribute) {
    if (!attribute.attribute_name || !attribute.attribute_value) {
      throw new Error('Missing required attribute fields');
    }
    const result = await db.query(
      `INSERT INTO product_attributes (product_id, attribute_name, attribute_value, created_at)
      VALUES ($1, $2, $3, NOW()) RETURNING *`,
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

  async getBySKU(sku) {
    try {
      const result = await db.query('SELECT * FROM products WHERE sku = $1 AND deleted_at IS NULL', [sku]);
      return result.rows[0];
    } catch (error) {
      console.error('Error fetching product by SKU:', error);
      throw error;
    }
  },

  async getFeatured(limit = 10) {
    const cacheKey = `products:featured:${limit}`;
    return await CacheService.cacheWrapper(cacheKey, async () => {
      const result = await db.query(
        'SELECT * FROM products WHERE featured = true AND status = $1 AND deleted_at IS NULL ORDER BY created_at DESC LIMIT $2',
        ['active', limit]
      );
      return result.rows;
    }, CACHE_TTL.PRODUCTS);
  },

  async getByCategory(categoryId, filters = {}) {
    let query = 'SELECT * FROM products WHERE category_id = $1 AND status = $2 AND deleted_at IS NULL';
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

  async updateStatus(id, status) {
    const result = await db.query(
      'UPDATE products SET status = $1, updated_at = NOW() WHERE id = $2 AND deleted_at IS NULL RETURNING *',
      [status, id]
    );
    
    // Invalidate cache
    await CacheService.del(CacheService.generateKey.product(id));
    await CacheService.invalidateCache('products:*');
    return result.rows[0];
  },

  async updateStock(id, quantity) {
    const result = await db.query(
      'UPDATE products SET stock_quantity = $1, updated_at = NOW() WHERE id = $2 AND deleted_at IS NULL RETURNING *',
      [quantity, id]
    );
    
    // Invalidate cache
    await CacheService.del(CacheService.generateKey.product(id));
    return result.rows[0];
  },
};

module.exports = ProductModel;