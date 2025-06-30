const express = require('express');
const router = express.Router();
const CartController = require('../controllers/cartController');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware); // Enable auth for all cart routes

// Get current user's cart
router.get('/', CartController.getCart);

// Add item to cart
router.post('/', CartController.addToCart);

// Update cart item quantity
router.put('/:itemId', CartController.updateCartItem);

// Remove item from cart
router.delete('/:itemId', CartController.removeCartItem);

module.exports = router;