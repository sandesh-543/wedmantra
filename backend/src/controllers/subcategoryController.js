const SubcategoryService = require('../services/subcategoryService');

const SubcategoryController = {
  async getAllSubcategories(req, res, next) {
    try {
      const categoryId = req.query.category_id || null;
      const subcategories = await SubcategoryService.getAllSubcategories(categoryId);
      res.json(subcategories);
    } catch (err) {
      next(err);
    }
  },
  async getSubcategoryById(req, res, next) {
    try {
      const subcategory = await SubcategoryService.getSubcategoryById(req.params.id);
      res.json(subcategory);
    } catch (err) {
      if (err.message === 'Subcategory not found') {
        return res.status(404).json({ message: err.message });
      }
      res.status(400).json({ message: err.message });
    }
  },
  async createSubcategory(req, res, next) {
    try {
      const subcategory = await SubcategoryService.createSubcategory(req.body);
      res.status(201).json(subcategory);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  },
  async updateSubcategory(req, res, next) {
    try {
      const subcategory = await SubcategoryService.updateSubcategory(req.params.id, req.body);
      res.json(subcategory);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  },
  async deleteSubcategory(req, res, next) {
    try {
      const result = await SubcategoryService.deleteSubcategory(req.params.id, req.body.category_id);
      res.json(result);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  },
};

module.exports = SubcategoryController; 