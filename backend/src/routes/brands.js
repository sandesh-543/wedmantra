const express = require('express');
const router = express.Router();
const BrandController = require('../controllers/brandController');
const { authenticate, authorize } = require('../middlewares/authMiddleware');
const { validateBrand, validateIdParam } = require('../middlewares/validation');

// Public endpoints
router.get('/', BrandController.getAllBrands);
router.get('/:id', validateIdParam, BrandController.getBrandById);

// Admin endpoints
router.post('/', 
  authenticate, 
  authorize(['admin', 'superadmin']), 
  validateBrand, 
  BrandController.createBrand
);

router.put('/:id', 
  authenticate, 
  authorize(['admin', 'superadmin']), 
  validateIdParam, 
  validateBrand, 
  BrandController.updateBrand
);

router.delete('/:id', 
  authenticate, 
  authorize(['admin', 'superadmin']), 
  validateIdParam, 
  BrandController.deleteBrand
);

module.exports = router;