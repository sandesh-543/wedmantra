const ProductService = require('../services/productService');

const ProductController = {
  async getAllProducts(req, res, next) {
    try {
      const products = await ProductService.getAllProducts();
      res.json(products);
    } catch (err) {
      next(err);
    }
  },
  async getProductById(req, res, next) {
    try {
      const product = await ProductService.getProductById(req.params.id);
      if (!product) return res.status(404).json({ message: 'Product not found' });
      res.json(product);
    } catch (err) {
      next(err);
    }
  },
  async createProduct(req, res, next) {
    try {
      const product = await ProductService.createProduct(req.body);
      res.status(201).json(product);
    } catch (err) {
      next(err);
    }
  },
  async updateProduct(req, res, next) {
    try {
      const product = await ProductService.updateProduct(req.params.id, req.body);
      res.json(product);
    } catch (err) {
      next(err);
    }
  },
  async deleteProduct(req, res, next) {
    try {
      await ProductService.deleteProduct(req.params.id);
      res.json({ message: 'Product deleted' });
    } catch (err) {
      next(err);
    }
  },
  // Media and attributes methods would be added here
};

module.exports = ProductController; 