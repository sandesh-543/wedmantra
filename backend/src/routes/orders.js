const express = require('express');
const router = express.Router();
const OrderController = require('../controllers/orderController');
const { authenticate, authorize } = require('../middlewares/authMiddleware');

// All routes require authentication
router.use(authenticate);

// Create order
router.post('/', OrderController.createOrder);

// Get user orders
router.get('/my-orders', OrderController.getUserOrders);

// Get specific order
router.get('/:id', OrderController.getOrderById);

// Update order status (admin only)
router.patch('/:id/status', authorize(['admin', 'superadmin']), OrderController.updateOrderStatus);

// Payment routes
router.post('/:orderId/payment', OrderController.processPayment);
router.post('/:orderId/verify-payment', OrderController.verifyPayment);

// Order tracking
router.patch('/:id/cancel', OrderController.cancelOrder);

// Order items
router.get('/:orderId/items', OrderController.getOrderItems);
router.post('/:orderId/items', OrderController.addOrderItem);
router.put('/:itemId', OrderController.updateOrderItem);
router.delete('/:itemId', OrderController.removeOrderItem);

// Admin endpoints
router.get('/', authorize(['admin', 'superadmin']), OrderController.getAllOrders);

module.exports = router; 