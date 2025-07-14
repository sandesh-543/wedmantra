const express = require('express');
const router = express.Router();
const WishlistController = require('../controllers/wishlistController');
const { authenticate } = require('../middlewares/authMiddleware');
const { validateWishlistItem, validateIdParam } = require('../middlewares/validation');

router.use(authenticate); // All wishlist routes require authentication

// Get current user's wishlist
router.get('/', WishlistController.getUserWishlist);

// Add item to wishlist
router.post('/', validateWishlistItem, WishlistController.addToWishlist);

// Remove item from wishlist
router.delete('/:productId', validateIdParam, WishlistController.removeFromWishlist);

module.exports = router;