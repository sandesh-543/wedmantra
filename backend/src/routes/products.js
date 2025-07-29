const express = require('express');
const router = express.Router();
const ProductController = require('../controllers/productController');
const { authenticate, authorize } = require('../middlewares/authMiddleware');
const { validateProductCreation, validateProductUpdate, validateIdParam } = require('../middlewares/validation');

// Public product endpoints (with pagination)
router.get('/search', ProductController.searchProducts); // Search with pagination
router.get('/featured', ProductController.getFeaturedProducts);
router.get('/category/:categoryId', ProductController.getProductsByCategory);
router.get('/', ProductController.getAllProducts); // List products with pagination
router.get('/:id', validateIdParam, ProductController.getProductById);

// Product media endpoints
router.get('/:id/media', validateIdParam, ProductController.getProductMedia);
router.post('/:id/media', authenticate, authorize(['admin', 'superadmin']), validateIdParam, ProductController.addProductMedia);
router.delete('/media/:mediaId', authenticate, authorize(['admin', 'superadmin']), validateIdParam, ProductController.deleteProductMedia);

// Product attributes endpoints  
router.get('/:id/attributes', validateIdParam, ProductController.getProductAttributes);
router.post('/:id/attributes', authenticate, authorize(['admin', 'superadmin']), validateIdParam, ProductController.addProductAttribute);
router.delete('/attributes/:attributeId', authenticate, authorize(['admin', 'superadmin']), validateIdParam, ProductController.deleteProductAttribute);

// Product CRUD (admin only)
router.post('/', authenticate, authorize(['admin', 'superadmin']), validateProductCreation, ProductController.createProduct);
router.put('/:id', authenticate, authorize(['admin', 'superadmin']), validateIdParam, validateProductUpdate, ProductController.updateProduct);

// Soft delete routes (admin only)
router.delete('/:id/soft', authenticate, authorize(['admin', 'superadmin']), validateIdParam, ProductController.softDeleteProduct);
router.patch('/:id/restore', authenticate, authorize(['admin', 'superadmin']), validateIdParam, ProductController.restoreProduct);

// Admin-only routes
router.get('/admin/deleted', authenticate, authorize(['admin', 'superadmin']), ProductController.getDeletedProducts);
router.get('/admin/all-with-deleted', authenticate, authorize(['superadmin']), ProductController.getAllProductsWithDeleted);

// Hard delete (superadmin only - for complete removal)
router.delete('/:id', authenticate, authorize(['superadmin']), validateIdParam, ProductController.deleteProduct);

module.exports = router;