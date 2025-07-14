const express = require('express');
const router = express.Router();
const CategoryController = require('../controllers/categoryController');
const { authenticate, authorize } = require('../middlewares/authMiddleware');
const { validateCategory, validateIdParam } = require('../middlewares/validation');

// Public endpoints
router.get('/', CategoryController.getAllCategories);
router.get('/:id', validateIdParam, CategoryController.getCategoryById);

// Admin endpoints
router.post('/', 
  authenticate, 
  authorize(['admin', 'superadmin']), 
  validateCategory, 
  CategoryController.createCategory
);

router.put('/:id', 
  authenticate, 
  authorize(['admin', 'superadmin']), 
  validateIdParam, 
  validateCategory, 
  CategoryController.updateCategory
);

router.delete('/:id', 
  authenticate, 
  authorize(['admin', 'superadmin']), 
  validateIdParam, 
  CategoryController.deleteCategory
);

module.exports = router;