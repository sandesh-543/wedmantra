const express = require('express');
const router = express.Router();
const OrderTrackingController = require('../controllers/orderTrackingController');
const { authenticate, authorize } = require('../middlewares/authMiddleware');
const { validateIdParam } = require('../middlewares/validation');

// Public tracking (no auth required)
router.get('/public/:orderNumber', OrderTrackingController.getPublicTracking);

// Protected routes
router.use(authenticate);

// Get order tracking details
router.get('/:orderId', validateIdParam, OrderTrackingController.getOrderTracking);

// Admin routes
router.patch('/:orderId/status', 
  validateIdParam,
  authorize(['admin', 'superadmin']), 
  OrderTrackingController.updateOrderStatus
);

router.get('/admin/pending-updates', 
  authorize(['admin', 'superadmin']), 
  OrderTrackingController.getOrdersNeedingUpdate
);

module.exports = router;