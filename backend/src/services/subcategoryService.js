const SubcategoryModel = require('../models/subcategoryModel');

const SubcategoryService = {
  async getAllSubcategories(categoryId = null) {
    return await SubcategoryModel.getAll(categoryId);
  },
  async getSubcategoryById(id) {
    if (!id) throw new Error('Subcategory ID is required');
    const subcategory = await SubcategoryModel.getById(id);
    if (!subcategory) throw new Error('Subcategory not found');
    return subcategory;
  },
  async createSubcategory(data) {
    if (!data.name || !data.slug || !data.category_id) throw new Error('Missing required subcategory fields');
    return await SubcategoryModel.create(data);
  },
  async updateSubcategory(id, data) {
    if (!id) throw new Error('Subcategory ID is required');
    if (!data.name || !data.slug || !data.category_id) throw new Error('Missing required subcategory fields');
    return await SubcategoryModel.update(id, data);
  },
  async deleteSubcategory(id, categoryId) {
    if (!id) throw new Error('Subcategory ID is required');
    return await SubcategoryModel.delete(id, categoryId);
  },
};

module.exports = SubcategoryService; 