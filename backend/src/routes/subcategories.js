const express = require('express');
const router = express.Router();
const SubcategoryController = require('../controllers/subcategoryController');
// const authMiddleware = require('../middlewares/authMiddleware');

// Public endpoints
router.get('/', SubcategoryController.getAllSubcategories); // List subcategories (optionally by category)
router.get('/:id', SubcategoryController.getSubcategoryById); // Get subcategory by ID

// Admin endpoints (add authMiddleware as needed)
router.post('/', /*authMiddleware,*/ SubcategoryController.createSubcategory); // Create subcategory
router.put('/:id', /*authMiddleware,*/ SubcategoryController.updateSubcategory); // Update subcategory
router.delete('/:id', /*authMiddleware,*/ SubcategoryController.deleteSubcategory); // Delete subcategory

module.exports = router; 