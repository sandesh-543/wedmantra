const express = require('express');
const router = express.Router();
const OrderController = require('../controllers/orderController');
// const authMiddleware = require('../middlewares/authMiddleware');

// router.use(authMiddleware); // Uncomment when auth is ready

// Create order
router.post('/', OrderController.createOrder);

// Get user orders
router.get('/', OrderController.getUserOrders);

// Get order by ID
router.get('/:id', OrderController.getOrderById);

// Update order status
router.put('/:id/status', OrderController.updateOrderStatus);

// TODO: Add payment routes, order tracking

module.exports = router; 