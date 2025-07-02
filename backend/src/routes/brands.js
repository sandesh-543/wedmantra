const express = require('express');
const router = express.Router();
const BrandController = require('../controllers/brandController');
// const authMiddleware = require('../middlewares/authMiddleware');

// Public endpoints
router.get('/', BrandController.getAllBrands); // List brands
router.get('/:id', BrandController.getBrandById); // Get brand by ID

// Admin endpoints (add authMiddleware as needed)
router.post('/', /*authMiddleware,*/ BrandController.createBrand); // Create brand
router.put('/:id', /*authMiddleware,*/ BrandController.updateBrand); // Update brand
router.delete('/:id', /*authMiddleware,*/ BrandController.deleteBrand); // Delete brand

module.exports = router; 