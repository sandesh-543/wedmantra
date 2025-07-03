const ProductModel = require('../models/productModel');
const CategoryModel = require('../models/categoryModel');
const SubcategoryModel = require('../models/subcategoryModel');
const BrandModel = require('../models/brandModel');

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
  async createProduct(productData, adminId) {
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

    // Generate unique SKU
    const sku = await this.generateUniqueSKU(productData.name);

    // Generate slug
    const slug = this.generateSlug(productData.name);

    const productToCreate = {
      ...productData,
      sku,
      slug,
      created_by: adminId,
      status: productData.status || 'active'
    };

    const product = await ProductModel.create(productToCreate);
    return product;
  },

  // Update an existing product
  async updateProduct(id, productData, adminId) {
    if (!id) throw new Error('Product ID is required');

    // Validate price if being updated
    if (productData.price && productData.price <= 0) {
      throw new Error('Price must be greater than 0');
    }

    if (productData.stock_quantity && productData.stock_quantity < 0) {
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
      const currentProduct = await ProductModel.getById(id);
      if (subcategory.category_id !== (productData.category_id || currentProduct.category_id)) {
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

    const product = await ProductModel.update(id, productData);
    return product;
  },

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

  async getProductsByCategory(categoryId, filters = {}) {
    return await ProductModel.getByCategory(categoryId, filters);
  },

  async getProductsBySubcategory(subcategoryId, filters = {}) {
    return await ProductModel.getBySubcategory(subcategoryId, filters);
  },

  async getProductsByBrand(brandId, filters = {}) {
    return await ProductModel.getByBrand(brandId, filters);
  },

  async getFeaturedProducts() {
    return await ProductModel.getFeatured();
  },

  async updateProductStatus(id, status) {
    const validStatuses = ['active', 'inactive', 'out_of_stock'];
    if (!validStatuses.includes(status)) {
      throw new Error('Invalid product status');
    }
    return await ProductModel.updateStatus(id, status);
  },

  async updateStock(id, quantity) {
    if (quantity < 0) {
      throw new Error('Stock quantity cannot be negative');
    }
    return await ProductModel.updateStock(id, quantity);
  },

  async incrementViews(id) {
    return await ProductModel.incrementViews(id);
  }
};

module.exports = ProductService; 