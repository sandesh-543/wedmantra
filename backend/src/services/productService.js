const ProductModel = require('../models/productModel');

const ProductService = {
  // Get all products with optional filters
  async getAllProducts(filters = {}) {
    // Validate filters if needed
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
    if (!productData.name || !productData.slug || !productData.sku || !productData.price) {
      throw new Error('Missing required product fields');
    }
    // TODO: Add more validation (e.g., unique slug, sku)
    const product = await ProductModel.create(productData);
    return product;
  },

  // Update an existing product
  async updateProduct(id, productData) {
    if (!id) throw new Error('Product ID is required');
    // Validate required fields
    if (!productData.name || !productData.slug || !productData.sku || !productData.price) {
      throw new Error('Missing required product fields');
    }
    // TODO: Add more validation (e.g., unique slug, sku)
    const product = await ProductModel.update(id, productData);
    return product;
  },

  // Delete a product
  async deleteProduct(id) {
    if (!id) throw new Error('Product ID is required');
    return await ProductModel.delete(id);
  },

  // Product media
  async getProductMedia(productId) {
    if (!productId) throw new Error('Product ID is required');
    return await ProductModel.getMedia(productId);
  },
  async addProductMedia(productId, media) {
    if (!productId) throw new Error('Product ID is required');
    return await ProductModel.addMedia(productId, media);
  },
  async deleteProductMedia(mediaId) {
    if (!mediaId) throw new Error('Media ID is required');
    return await ProductModel.deleteMedia(mediaId);
  },

  // Product attributes
  async getProductAttributes(productId) {
    if (!productId) throw new Error('Product ID is required');
    return await ProductModel.getAttributes(productId);
  },
  async addProductAttribute(productId, attribute) {
    if (!productId) throw new Error('Product ID is required');
    return await ProductModel.addAttribute(productId, attribute);
  },
  async deleteProductAttribute(attributeId) {
    if (!attributeId) throw new Error('Attribute ID is required');
    return await ProductModel.deleteAttribute(attributeId);
  },

  // Search and filter products
  async searchProducts(filters) {
    // Parse and validate filters
    const page = filters.page ? parseInt(filters.page, 10) : 1;
    const limit = filters.limit ? parseInt(filters.limit, 10) : 20;
    // Pass all filters to model
    return await ProductModel.search({
      ...filters,
      page,
      limit,
    });
  },
};

module.exports = ProductService; 