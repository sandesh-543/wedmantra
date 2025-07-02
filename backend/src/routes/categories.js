const express = require('express');
const router = express.Router();
const CategoryController = require('../controllers/categoryController');
// const authMiddleware = require('../middlewares/authMiddleware');

// Public endpoints
router.get('/', CategoryController.getAllCategories); // List categories
router.get('/:id', CategoryController.getCategoryById); // Get category by ID

// Admin endpoints (add authMiddleware as needed)
router.post('/', /*authMiddleware,*/ CategoryController.createCategory); // Create category
router.put('/:id', /*authMiddleware,*/ CategoryController.updateCategory); // Update category
router.delete('/:id', /*authMiddleware,*/ CategoryController.deleteCategory); // Delete category

module.exports = router; 