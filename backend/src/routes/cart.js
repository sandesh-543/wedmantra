const express = require('express');
const router = express.Router();
const CartController = require('../controllers/cartController');
const { authenticate } = require('../middlewares/authMiddleware');
const { validateCartItem, validateCartItemUpdate, validateIdParam } = require('../middlewares/validation');

router.use(authenticate); // All cart routes require authentication

// Get current user's cart
router.get('/', CartController.getCart);

// Add item to cart
router.post('/', validateCartItem, CartController.addToCart);

// Update cart item quantity
router.put('/:itemId', validateIdParam, validateCartItemUpdate, CartController.updateCartItem);

// Remove item from cart
router.delete('/:itemId', validateIdParam, CartController.removeCartItem);

module.exports = router;