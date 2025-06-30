const WishlistService = require('../services/wishlistService');

const WishlistController = {
  async getUserWishlist(req, res, next) {
    try {
      const wishlist = await WishlistService.getUserWishlist(req.user.id);
      res.json(wishlist);
    } catch (err) {
      next(err);
    }
  },
  async addToWishlist(req, res, next) {
    try {
      const item = await WishlistService.addToWishlist(req.user.id, req.body.productId);
      res.status(201).json(item);
    } catch (err) {
      next(err);
    }
  },
  async removeFromWishlist(req, res, next) {
    try {
      await WishlistService.removeFromWishlist(req.user.id, req.params.productId);
      res.json({ message: 'Item removed from wishlist' });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = WishlistController; 