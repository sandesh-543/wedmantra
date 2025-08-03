const ProductModel = require('../models/productModel');
const CategoryModel = require('../models/categoryModel');
const SubcategoryModel = require('../models/subcategoryModel');
const BrandModel = require('../models/brandModel');
const db = require('../config/db');

const ProductService = {
  // Get all products with optional filters and pagination
  async getAllProducts(filters = {}) {
    return await ProductModel.getAll(filters);
  },

  // Get a single product by ID (with media and attributes)
  async getProductById(id) {
    if (!id) throw new Error('Product ID is required');
    const product = await ProductModel.getById(id);
    if (!product) throw new Error('Product not found');
    
    // Attach media and attributes
    product.media = await ProductModel.getMedia(id);
    product.attributes = await ProductModel.getAttributes(id);
    return product;
  },

  // Create a new product
  async createProduct(productData) {
    // Validate required fields
    if (!productData.name || !productData.price || !productData.category_id) {
      throw new Error('Name, price, and category are required');
    }

    if (productData.price <= 0) {
      throw new Error('Price must be greater than 0');
    }

    if (productData.stock_quantity < 0) {
      throw new Error('Stock quantity cannot be negative');
    }

    // Validate category exists
    const category = await CategoryModel.getById(productData.category_id);
    if (!category) {
      throw new Error('Category not found');
    }

    // Validate subcategory if provided
    if (productData.subcategory_id) {
      const subcategory = await SubcategoryModel.getById(productData.subcategory_id);
      if (!subcategory) {
        throw new Error('Subcategory not found');
      }
      if (subcategory.category_id !== productData.category_id) {
        throw new Error('Subcategory does not belong to the specified category');
      }
    }

    // Validate brand if provided
    if (productData.brand_id) {
      const brand = await BrandModel.getById(productData.brand_id);
      if (!brand) {
        throw new Error('Brand not found');
      }
    }

    // Generate unique SKU if not provided
    if (!productData.sku) {
      productData.sku = await this.generateUniqueSKU(productData.name);
    }

    // Generate slug if not provided
    if (!productData.slug) {
      productData.slug = this.generateSlug(productData.name);
    }

    const productToCreate = {
      ...productData,
      status: productData.status || 'active',
      stock_quantity: productData.stock_quantity || 0,
      manage_stock: productData.manage_stock !== false,
      stock_status: productData.stock_status || 'in_stock'
    };

    return await ProductModel.create(productToCreate);
  },

  // Update an existing product
  async updateProduct(id, productData) {
    if (!id) throw new Error('Product ID is required');

    // Check if product exists and is not deleted
    const existingProduct = await ProductModel.getById(id);
    if (!existingProduct) {
      throw new Error('Product not found');
    }

    // Validate price if being updated
    if (productData.price !== undefined && productData.price <= 0) {
      throw new Error('Price must be greater than 0');
    }

    if (productData.stock_quantity !== undefined && productData.stock_quantity < 0) {
      throw new Error('Stock quantity cannot be negative');
    }

    // Validate category if being updated
    if (productData.category_id) {
      const category = await CategoryModel.getById(productData.category_id);
      if (!category) {
        throw new Error('Category not found');
      }
    }

    // Validate subcategory if being updated
    if (productData.subcategory_id) {
      const subcategory = await SubcategoryModel.getById(productData.subcategory_id);
      if (!subcategory) {
        throw new Error('Subcategory not found');
      }
      const categoryId = productData.category_id || existingProduct.category_id;
      if (subcategory.category_id !== categoryId) {
        throw new Error('Subcategory does not belong to the specified category');
      }
    }

    // Validate brand if being updated
    if (productData.brand_id) {
      const brand = await BrandModel.getById(productData.brand_id);
      if (!brand) {
        throw new Error('Brand not found');
      }
    }

    // Generate new slug if name is being updated
    if (productData.name) {
      productData.slug = this.generateSlug(productData.name);
    }

    // Merge with existing product data
    const updatedData = {
      ...existingProduct,
      ...productData,
      updated_at: new Date()
    };

    return await ProductModel.update(id, updatedData);
  },

  // Soft delete a product
  async softDeleteProduct(id) {
    if (!id) throw new Error('Product ID is required');
    return await ProductModel.softDelete(id);
  },

  // Restore a soft deleted product
  async restoreProduct(id) {
    if (!id) throw new Error('Product ID is required');
    return await ProductModel.restore(id);
  },

  // Hard delete a product (permanent deletion)
  async deleteProduct(id) {
    if (!id) throw new Error('Product ID is required');
    return await ProductModel.delete(id);
  },

  // Get all products including soft deleted (admin only)
  async getAllProductsWithDeleted(filters = {}) {
    return await ProductModel.getAllWithDeleted(filters);
  },

  // Get only soft deleted products
  async getDeletedProducts(filters = {}) {
    return await ProductModel.getDeleted(filters);
  },

  // Utility methods
  async generateUniqueSKU(name) {
    const baseSKU = name.substring(0, 3).toUpperCase() + Date.now().toString().slice(-6);
    let sku = baseSKU;
    let counter = 1;

    while (await ProductModel.getBySKU(sku)) {
      sku = `${baseSKU}-${counter}`;
      counter++;
    }

    return sku;
  },

  generateSlug(name) {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-');
  },

  // Product media methods
  async getProductMedia(productId) {
    if (!productId) throw new Error('Product ID is required');
    return await ProductModel.getMedia(productId);
  },

  async addProductMedia(productId, media) {
    if (!productId) throw new Error('Product ID is required');
    
    // Validate product exists
    const product = await ProductModel.getById(productId);
    if (!product) throw new Error('Product not found');
    
    return await ProductModel.addMedia(productId, media);
  },

  async deleteProductMedia(mediaId) {
    if (!mediaId) throw new Error('Media ID is required');
    return await ProductModel.deleteMedia(mediaId);
  },

  // Product attributes methods
  async getProductAttributes(productId) {
    if (!productId) throw new Error('Product ID is required');
    return await ProductModel.getAttributes(productId);
  },

  async addProductAttribute(productId, attribute) {
    if (!productId) throw new Error('Product ID is required');
    
    // Validate product exists
    const product = await ProductModel.getById(productId);
    if (!product) throw new Error('Product not found');
    
    return await ProductModel.addAttribute(productId, attribute);
  },

  async deleteProductAttribute(attributeId) {
    if (!attributeId) throw new Error('Attribute ID is required');
    return await ProductModel.deleteAttribute(attributeId);
  },

  // Search and filter products
  async searchProducts(filters) {
    const page = filters.page ? parseInt(filters.page, 10) : 1;
    const limit = filters.limit ? Math.min(parseInt(filters.limit, 10), 100) : 20;
    
    return await ProductModel.search({
      ...filters,
      page,
      limit,
    });
  },

  async getFeaturedProducts(limit = 10) {
    return await ProductModel.getFeatured(limit);
  },

  async getProductsByCategory(categoryId, filters = {}) {
    if (!categoryId) throw new Error('Category ID is required');
    
    // Validate category exists
    const category = await CategoryModel.getById(categoryId);
    if (!category) throw new Error('Category not found');
    
    // Add pagination to filters
    const page = parseInt(filters.page) || 1;
    const limit = Math.min(parseInt(filters.limit) || 20, 100);
    const offset = (page - 1) * limit;
    
    const products = await ProductModel.getByCategory(categoryId, {
      ...filters,
      limit,
      offset
    });
    
    // Get total count for pagination
    const countResult = await db.query(
      'SELECT COUNT(*) FROM products WHERE category_id = $1 AND status = $2 AND deleted_at IS NULL',
      [categoryId, 'active']
    );
    const total = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(total / limit);
    
    return {
      products,
      pagination: {
        page,
        limit,
        total,
        pages: totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    };
  },

  // Product status and stock management
  async updateProductStatus(id, status) {
    const validStatuses = ['active', 'inactive', 'draft'];
    if (!validStatuses.includes(status)) {
      throw new Error('Invalid product status');
    }
    
    const product = await ProductModel.getById(id);
    if (!product) throw new Error('Product not found');
    
    return await ProductModel.updateStatus(id, status);
  },

  async updateStock(id, quantity) {
    if (quantity < 0) {
      throw new Error('Stock quantity cannot be negative');
    }
    
    const product = await ProductModel.getById(id);
    if (!product) throw new Error('Product not found');
    
    // Update stock status based on quantity
    let stockStatus = 'in_stock';
    if (quantity === 0) {
      stockStatus = 'out_of_stock';
    }
    
    // Update both quantity and status
    await db.query(
      'UPDATE products SET stock_quantity = $1, stock_status = $2, updated_at = NOW() WHERE id = $3',
      [quantity, stockStatus, id]
    );
    
    return await ProductModel.getById(id);
  },

  // Bulk operations
  async bulkUpdateProducts(productIds, operation, data = {}) {
    if (!Array.isArray(productIds) || productIds.length === 0) {
      throw new Error('Product IDs array is required');
    }

    const results = [];
    
    for (const productId of productIds) {
      try {
        let result;
        
        switch (operation) {
          case 'soft_delete':
            result = await this.softDeleteProduct(productId);
            break;
          case 'restore':
            result = await this.restoreProduct(productId);
            break;
          case 'update_status':
            if (!data.status) throw new Error('Status is required for update_status operation');
            result = await this.updateProductStatus(productId, data.status);
            break;
          case 'update_category':
            if (!data.category_id) throw new Error('Category ID is required for update_category operation');
            result = await this.updateProduct(productId, { category_id: data.category_id });
            break;
          default:
            throw new Error('Invalid bulk operation');
        }
        
        results.push({ productId, success: true, data: result });
      } catch (error) {
        results.push({ productId, success: false, error: error.message });
      }
    }
    
    return results;
  },

  // Product statistics for admin dashboard
  async getProductStats() {
    try {
      const stats = await db.query(`
        SELECT 
          COUNT(*) FILTER (WHERE deleted_at IS NULL) as active_products,
          COUNT(*) FILTER (WHERE deleted_at IS NOT NULL) as deleted_products,
          COUNT(*) FILTER (WHERE status = 'active' AND deleted_at IS NULL) as published_products,
          COUNT(*) FILTER (WHERE status = 'draft' AND deleted_at IS NULL) as draft_products,
          COUNT(*) FILTER (WHERE status = 'inactive' AND deleted_at IS NULL) as inactive_products,
          COUNT(*) FILTER (WHERE stock_quantity = 0 AND deleted_at IS NULL) as out_of_stock_products,
          COUNT(*) FILTER (WHERE stock_quantity > 0 AND stock_quantity <= 10 AND deleted_at IS NULL) as low_stock_products,
          COUNT(*) FILTER (WHERE featured = true AND deleted_at IS NULL) as featured_products,
          AVG(price) FILTER (WHERE deleted_at IS NULL) as average_price,
          MIN(price) FILTER (WHERE deleted_at IS NULL) as min_price,
          MAX(price) FILTER (WHERE deleted_at IS NULL) as max_price,
          SUM(stock_quantity) FILTER (WHERE deleted_at IS NULL) as total_stock
        FROM products
      `);
      
      const categoryStats = await db.query(`
        SELECT 
          c.name as category_name,
          COUNT(p.id) as product_count
        FROM categories c
        LEFT JOIN products p ON c.id = p.category_id AND p.deleted_at IS NULL
        GROUP BY c.id, c.name
        ORDER BY product_count DESC
      `);
      
      const recentProducts = await db.query(`
        SELECT id, name, price, status, created_at
        FROM products 
        WHERE deleted_at IS NULL
        ORDER BY created_at DESC
        LIMIT 5
      `);
      
      return {
        overview: stats.rows[0],
        categoryBreakdown: categoryStats.rows,
        recentProducts: recentProducts.rows
      };
    } catch (error) {
      console.error('Error fetching product stats:', error);
      throw error;
    }
  }
};

module.exports = ProductService;