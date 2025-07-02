const express = require('express');
const router = express.Router();
const ProductController = require('../controllers/productController');
// const authMiddleware = require('../middlewares/authMiddleware');

// Public product endpoints
router.get('/', ProductController.getAllProducts); // List products (with filters)
router.get('/:id', ProductController.getProductById); // Get product by ID

// Product CRUD (admin only, add authMiddleware as needed)
router.post('/', /*authMiddleware,*/ ProductController.createProduct); // Create product
router.put('/:id', /*authMiddleware,*/ ProductController.updateProduct); // Update product
router.delete('/:id', /*authMiddleware,*/ ProductController.deleteProduct); // Delete product

// Product media endpoints
router.get('/:id/media', ProductController.getProductMedia); // Get product media
router.post('/:id/media', /*authMiddleware,*/ ProductController.addProductMedia); // Add product media
router.delete('/media/:mediaId', /*authMiddleware,*/ ProductController.deleteProductMedia); // Delete product media

// Product attributes endpoints
router.get('/:id/attributes', ProductController.getProductAttributes); // Get product attributes
router.post('/:id/attributes', /*authMiddleware,*/ ProductController.addProductAttribute); // Add product attribute
router.delete('/attributes/:attributeId', /*authMiddleware,*/ ProductController.deleteProductAttribute); // Delete product attribute

module.exports = router;
