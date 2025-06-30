const ProductModel = require('../models/productModel');

const ProductService = {
  async getAllProducts() {
    return await ProductModel.getAll();
  },
  async getProductById(id) {
    return await ProductModel.getById(id);
  },
  async createProduct(product) {
    return await ProductModel.create(product);
  },
  async updateProduct(id, product) {
    return await ProductModel.update(id, product);
  },
  async deleteProduct(id) {
    return await ProductModel.delete(id);
  },
  // Media and attributes methods would be added here
};

module.exports = ProductService; 