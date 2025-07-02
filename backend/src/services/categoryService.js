const CategoryModel = require('../models/categoryModel');

const CategoryService = {
  async getAllCategories() {
    return await CategoryModel.getAll();
  },
  async getCategoryById(id) {
    if (!id) throw new Error('Category ID is required');
    const category = await CategoryModel.getById(id);
    if (!category) throw new Error('Category not found');
    return category;
  },
  async createCategory(data) {
    if (!data.name || !data.slug) throw new Error('Missing required category fields');
    return await CategoryModel.create(data);
  },
  async updateCategory(id, data) {
    if (!id) throw new Error('Category ID is required');
    if (!data.name || !data.slug) throw new Error('Missing required category fields');
    return await CategoryModel.update(id, data);
  },
  async deleteCategory(id) {
    if (!id) throw new Error('Category ID is required');
    return await CategoryModel.delete(id);
  },
};

module.exports = CategoryService; 