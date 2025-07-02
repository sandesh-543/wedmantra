const CategoryService = require('../services/categoryService');

const CategoryController = {
  async getAllCategories(req, res, next) {
    try {
      const categories = await CategoryService.getAllCategories();
      res.json(categories);
    } catch (err) {
      next(err);
    }
  },
  async getCategoryById(req, res, next) {
    try {
      const category = await CategoryService.getCategoryById(req.params.id);
      res.json(category);
    } catch (err) {
      if (err.message === 'Category not found') {
        return res.status(404).json({ message: err.message });
      }
      res.status(400).json({ message: err.message });
    }
  },
  async createCategory(req, res, next) {
    try {
      const category = await CategoryService.createCategory(req.body);
      res.status(201).json(category);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  },
  async updateCategory(req, res, next) {
    try {
      const category = await CategoryService.updateCategory(req.params.id, req.body);
      res.json(category);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  },
  async deleteCategory(req, res, next) {
    try {
      const result = await CategoryService.deleteCategory(req.params.id);
      res.json(result);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  },
};

module.exports = CategoryController; 