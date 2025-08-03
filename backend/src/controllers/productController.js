const ProductService = require('../services/productService');

const ProductController = {
  // Get all products with pagination
  async getAllProducts(req, res, next) {
    try {
      const filters = {
        ...req.query,
        page: parseInt(req.query.page) || 1,
        limit: Math.min(parseInt(req.query.limit) || 20, 100) // Max 100 items per page
      };
      
      const result = await ProductService.getAllProducts(filters);
      
      res.json({
        success: true,
        data: result.products,
        pagination: result.pagination,
        filters: {
          applied: filters,
          available: {
            sortOptions: [
              { value: 'created_at', label: 'Newest First', order: 'DESC' },
              { value: 'price', label: 'Price: Low to High', order: 'ASC' },
              { value: 'price', label: 'Price: High to Low', order: 'DESC' },
              { value: 'name', label: 'Name: A to Z', order: 'ASC' },
              { value: 'name', label: 'Name: Z to A', order: 'DESC' }
            ]
          }
        }
      });
    } catch (err) {
      next(err);
    }
  },

  // Get a single product by ID
  async getProductById(req, res, next) {
    try {
      const product = await ProductService.getProductById(req.params.id);
      res.json({
        success: true,
        data: product
      });
    } catch (err) {
      if (err.message === 'Product not found') {
        return res.status(404).json({
          success: false,
          message: err.message
        });
      }
      next(err);
    }
  },

  // Create a new product
  async createProduct(req, res, next) {
    try {
      const productData = { ...req.body, created_by: req.user.id };
      const product = await ProductService.createProduct(productData);
      res.status(201).json({
        success: true,
        message: 'Product created successfully',
        data: product
      });
    } catch (err) {
      res.status(400).json({
        success: false,
        message: err.message
      });
    }
  },

  // Update an existing product
  async updateProduct(req, res, next) {
    try {
      const product = await ProductService.updateProduct(req.params.id, req.body);
      res.json({
        success: true,
        message: 'Product updated successfully',
        data: product
      });
    } catch (err) {
      res.status(400).json({
        success: false,
        message: err.message
      });
    }
  },

  // Soft delete a product
  async softDeleteProduct(req, res, next) {
    try {
      const product = await ProductService.softDeleteProduct(req.params.id);
      res.json({
        success: true,
        message: 'Product moved to trash successfully',
        data: product
      });
    } catch (err) {
      if (err.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          message: err.message
        });
      }
      res.status(400).json({
        success: false,
        message: err.message
      });
    }
  },

  // Restore a soft deleted product
  async restoreProduct(req, res, next) {
    try {
      const product = await ProductService.restoreProduct(req.params.id);
      res.json({
        success: true,
        message: 'Product restored successfully',
        data: product
      });
    } catch (err) {
      if (err.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          message: err.message
        });
      }
      res.status(400).json({
        success: false,
        message: err.message
      });
    }
  },

  // Hard delete a product (permanent deletion - superadmin only)
  async deleteProduct(req, res, next) {
    try {
      const result = await ProductService.deleteProduct(req.params.id);
      res.json({
        success: true,
        message: 'Product permanently deleted'
      });
    } catch (err) {
      res.status(400).json({
        success: false,
        message: err.message
      });
    }
  },

  // Get all products including soft deleted (admin only)
  async getAllProductsWithDeleted(req, res, next) {
    try {
      const filters = {
        ...req.query,
        page: parseInt(req.query.page) || 1,
        limit: Math.min(parseInt(req.query.limit) || 20, 100)
      };
      
      const result = await ProductService.getAllProductsWithDeleted(filters);
      
      res.json({
        success: true,
        data: result.products,
        pagination: result.pagination,
        message: 'Retrieved all products including deleted ones'
      });
    } catch (err) {
      next(err);
    }
  },

  // Get only soft deleted products (admin only)
  async getDeletedProducts(req, res, next) {
    try {
      const filters = {
        page: parseInt(req.query.page) || 1,
        limit: Math.min(parseInt(req.query.limit) || 20, 100)
      };
      
      const result = await ProductService.getDeletedProducts(filters);
      
      res.json({
        success: true,
        data: result.products,
        pagination: result.pagination,
        message: 'Retrieved deleted products'
      });
    } catch (err) {
      next(err);
    }
  },

  // Product media endpoints
  async getProductMedia(req, res, next) {
    try {
      const media = await ProductService.getProductMedia(req.params.id);
      res.json({
        success: true,
        data: media
      });
    } catch (err) {
      next(err);
    }
  },

  async addProductMedia(req, res, next) {
    try {
      const media = await ProductService.addProductMedia(req.params.id, req.body);
      res.status(201).json({
        success: true,
        message: 'Media added successfully',
        data: media
      });
    } catch (err) {
      res.status(400).json({
        success: false,
        message: err.message
      });
    }
  },

  async deleteProductMedia(req, res, next) {
    try {
      const result = await ProductService.deleteProductMedia(req.params.mediaId);
      res.json({
        success: true,
        message: 'Media deleted successfully'
      });
    } catch (err) {
      res.status(400).json({
        success: false,
        message: err.message
      });
    }
  },

  // Product attributes endpoints  
  async getProductAttributes(req, res, next) {
    try {
      const attributes = await ProductService.getProductAttributes(req.params.id);
      res.json({
        success: true,
        data: attributes
      });
    } catch (err) {
      next(err);
    }
  },

  async addProductAttribute(req, res, next) {
    try {
      const attribute = await ProductService.addProductAttribute(req.params.id, req.body);
      res.status(201).json({
        success: true,
        message: 'Attribute added successfully',
        data: attribute
      });
    } catch (err) {
      res.status(400).json({
        success: false,
        message: err.message
      });
    }
  },

  async deleteProductAttribute(req, res, next) {
    try {
      const result = await ProductService.deleteProductAttribute(req.params.attributeId);
      res.json({
        success: true,
        message: 'Attribute deleted successfully'
      });
    } catch (err) {
      res.status(400).json({
        success: false,
        message: err.message
      });
    }
  },

  // Search and filter products with pagination
  async searchProducts(req, res, next) {
    try {
      const filters = {
        ...req.query,
        page: parseInt(req.query.page) || 1,
        limit: Math.min(parseInt(req.query.limit) || 20, 100)
      };
      
      const result = await ProductService.searchProducts(filters);
      
      res.json({
        success: true,
        data: result.products,
        pagination: result.pagination,
        total: result.total,
        filters: {
          applied: filters,
          available: {
            fabrics: ['Cotton', 'Silk', 'Georgette', 'Chiffon', 'Crepe', 'Net', 'Velvet'],
            occasions: ['Wedding', 'Festival', 'Party', 'Casual', 'Office', 'Traditional'],
            regions: ['Banarasi', 'Kanchipuram', 'Bengali', 'Gujarati', 'Rajasthani', 'South Indian'],
            workTypes: ['Embroidery', 'Print', 'Plain', 'Zari Work', 'Sequin Work', 'Stone Work'],
            priceRanges: [
              { min: 0, max: 1000, label: 'Under ₹1,000' },
              { min: 1000, max: 3000, label: '₹1,000 - ₹3,000' },
              { min: 3000, max: 5000, label: '₹3,000 - ₹5,000' },
              { min: 5000, max: 10000, label: '₹5,000 - ₹10,000' },
              { min: 10000, max: null, label: 'Above ₹10,000' }
            ],
            sortOptions: [
              { value: 'newest', label: 'Newest First' },
              { value: 'price_asc', label: 'Price: Low to High' },
              { value: 'price_desc', label: 'Price: High to Low' },
              { value: 'name_asc', label: 'Name: A to Z' },
              { value: 'name_desc', label: 'Name: Z to A' }
            ]
          }
        }
      });
    } catch (err) {
      next(err);
    }
  },

  // Get featured products
  async getFeaturedProducts(req, res, next) {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit, 10) : 10;
      const products = await ProductService.getFeaturedProducts(limit);
      res.json({
        success: true,
        data: products,
        count: products.length
      });
    } catch (err) {
      next(err);
    }
  },

  // Get products by category with pagination
  async getProductsByCategory(req, res, next) {
    try {
      const { categoryId } = req.params;
      const filters = {
        ...req.query,
        page: parseInt(req.query.page) || 1,
        limit: Math.min(parseInt(req.query.limit) || 20, 100)
      };
      
      const result = await ProductService.getProductsByCategory(categoryId, filters);
      res.json({
        success: true,
        data: result.products,
        pagination: result.pagination,
        category_id: categoryId,
        count: result.products.length
      });
    } catch (err) {
      next(err);
    }
  },

  // Update product status
  async updateProductStatus(req, res, next) {
    try {
      const { status } = req.body;
      const validStatuses = ['active', 'inactive', 'draft'];
      
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status. Must be one of: active, inactive, draft'
        });
      }
      
      const product = await ProductService.updateProductStatus(req.params.id, status);
      res.json({
        success: true,
        message: 'Product status updated successfully',
        data: product
      });
    } catch (err) {
      res.status(400).json({
        success: false,
        message: err.message
      });
    }
  },

  // Update product stock
  async updateProductStock(req, res, next) {
    try {
      const { quantity } = req.body;
      
      if (quantity === undefined || quantity < 0) {
        return res.status(400).json({
          success: false,
          message: 'Quantity must be a non-negative number'
        });
      }
      
      const product = await ProductService.updateStock(req.params.id, quantity);
      res.json({
        success: true,
        message: 'Product stock updated successfully',
        data: product
      });
    } catch (err) {
      res.status(400).json({
        success: false,
        message: err.message
      });
    }
  },

  // Bulk operations for admin
  async bulkUpdateProducts(req, res, next) {
    try {
      const { productIds, operation, data } = req.body;
      
      if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Product IDs array is required'
        });
      }
      
      const validOperations = ['soft_delete', 'restore', 'update_status', 'update_category'];
      if (!validOperations.includes(operation)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid operation'
        });
      }
      
      const result = await ProductService.bulkUpdateProducts(productIds, operation, data);
      res.json({
        success: true,
        message: `Bulk ${operation} completed successfully`,
        data: result
      });
    } catch (err) {
      res.status(400).json({
        success: false,
        message: err.message
      });
    }
  },

  // Get product statistics (admin dashboard)
  async getProductStats(req, res, next) {
    try {
      const stats = await ProductService.getProductStats();
      res.json({
        success: true,
        data: stats
      });
    } catch (err) {
      next(err);
    }
  }
};

module.exports = ProductController;