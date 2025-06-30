const express = require('express');
const router = express.Router();
const WishlistController = require('../controllers/wishlistController');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware); // Enable auth for all wishlist routes

// Get user wishlist
router.get('/', WishlistController.getUserWishlist);

// Add to wishlist
router.post('/', WishlistController.addToWishlist);

// Remove from wishlist
router.delete('/:productId', WishlistController.removeFromWishlist);

module.exports = router; 