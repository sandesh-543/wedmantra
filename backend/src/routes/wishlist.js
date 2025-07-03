const express = require('express');
const router = express.Router();
const WishlistController = require('../controllers/wishlistController');
const { authenticate } = require('../middlewares/authMiddleware');

router.use(authenticate); // Enable auth for all wishlist routes

// Get current user's wishlist
router.get('/', WishlistController.getUserWishlist);

// Add item to wishlist
router.post('/', WishlistController.addToWishlist);

// Remove item from wishlist
router.delete('/:productId', WishlistController.removeFromWishlist);

module.exports = router; 