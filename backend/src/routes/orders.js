const express = require('express');
const router = express.Router();
const OrderController = require('../controllers/orderController');
const { authenticate, authorize } = require('../middlewares/authMiddleware');
const { validateOrderCreation, validateIdParam } = require('../middlewares/validation');

// All routes require authentication
router.use(authenticate);

// Create order
router.post('/', validateOrderCreation, OrderController.createOrder);

// Get user orders
router.get('/my-orders', OrderController.getUserOrders);

// Get specific order
router.get('/:id', validateIdParam, OrderController.getOrderById);

// Update order status (admin only)
router.patch('/:id/status', 
  validateIdParam, 
  authorize(['admin', 'superadmin']), 
  OrderController.updateOrderStatus
);

// Payment routes
router.post('/:orderId/payment', validateIdParam, OrderController.processPayment);
router.post('/:orderId/verify-payment', validateIdParam, OrderController.verifyPayment);

// Order tracking
router.patch('/:id/cancel', validateIdParam, OrderController.cancelOrder);

// Order items
router.get('/:orderId/items', validateIdParam, OrderController.getOrderItems);
router.post('/:orderId/items', validateIdParam, OrderController.addOrderItem);
router.put('/items/:itemId', validateIdParam, OrderController.updateOrderItem);
router.delete('/items/:itemId', validateIdParam, OrderController.removeOrderItem);

// Admin endpoints
router.get('/', authorize(['admin', 'superadmin']), OrderController.getAllOrders);

module.exports = router;