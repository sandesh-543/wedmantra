const express = require('express');
const router = express.Router();
const ProductController = require('../controllers/productController');

// Get all products
router.get('/', ProductController.getAllProducts);

// Get product by ID
router.get('/:id', ProductController.getProductById);

// Create product
router.post('/', ProductController.createProduct);

// Update product
router.put('/:id', ProductController.updateProduct);

// Delete product
router.delete('/:id', ProductController.deleteProduct);

// Add more routes as needed (media, attributes)

module.exports = router;
