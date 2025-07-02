const ProductService = require('../services/productService');

const ProductController = {
  // Get all products (with optional filters)
  async getAllProducts(req, res, next) {
    try {
      const filters = req.query || {};
      const products = await ProductService.getAllProducts(filters);
      res.json(products);
    } catch (err) {
      next(err);
    }
  },

  // Get a single product by ID (with media and attributes)
  async getProductById(req, res, next) {
    try {
      const product = await ProductService.getProductById(req.params.id);
      res.json(product);
    } catch (err) {
      if (err.message === 'Product not found') {
        return res.status(404).json({ message: err.message });
      }
      next(err);
    }
  },

  // Create a new product
  async createProduct(req, res, next) {
    try {
      const productData = { ...req.body, created_by: req.user.id };
      const product = await ProductService.createProduct(productData);
      res.status(201).json(product);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  },

  // Update an existing product
  async updateProduct(req, res, next) {
    try {
      const product = await ProductService.updateProduct(req.params.id, req.body);
      res.json(product);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  },

  // Delete a product
  async deleteProduct(req, res, next) {
    try {
      const result = await ProductService.deleteProduct(req.params.id);
      res.json(result);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  },

  // Product media endpoints
  async getProductMedia(req, res, next) {
    try {
      const media = await ProductService.getProductMedia(req.params.id);
      res.json(media);
    } catch (err) {
      next(err);
    }
  },
  async addProductMedia(req, res, next) {
    try {
      const media = await ProductService.addProductMedia(req.params.id, req.body);
      res.status(201).json(media);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  },
  async deleteProductMedia(req, res, next) {
    try {
      const result = await ProductService.deleteProductMedia(req.params.mediaId);
      res.json(result);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  },

  // Product attributes endpoints
  async getProductAttributes(req, res, next) {
    try {
      const attributes = await ProductService.getProductAttributes(req.params.id);
      res.json(attributes);
    } catch (err) {
      next(err);
    }
  },
  async addProductAttribute(req, res, next) {
    try {
      const attribute = await ProductService.addProductAttribute(req.params.id, req.body);
      res.status(201).json(attribute);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  },
  async deleteProductAttribute(req, res, next) {
    try {
      const result = await ProductService.deleteProductAttribute(req.params.attributeId);
      res.json(result);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  },

  // Search and filter products
  async searchProducts(req, res, next) {
    try {
      const filters = req.query;
      const { total, products } = await ProductService.searchProducts(filters);
      const page = filters.page ? parseInt(filters.page, 10) : 1;
      const limit = filters.limit ? parseInt(filters.limit, 10) : 20;
      res.json({ success: true, page, limit, total, products });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = ProductController; 