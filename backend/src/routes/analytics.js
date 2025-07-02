const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { authenticate, authorize } = require('../middlewares/authMiddleware');

router.use(authenticate);
router.use(authorize(['admin', 'superadmin']));

router.get('/summary', analyticsController.getSummary);
router.get('/top-products', analyticsController.getTopProducts);
router.get('/product-views', analyticsController.getProductViews);

module.exports = router; 