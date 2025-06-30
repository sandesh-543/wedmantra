const WishlistModel = require('../models/wishlistModel');

const WishlistService = {
  async getUserWishlist(userId) {
    return await WishlistModel.getByUser(userId);
  },
  async addToWishlist(userId, productId) {
    return await WishlistModel.addItem(userId, productId);
  },
  async removeFromWishlist(userId, productId) {
    return await WishlistModel.removeItem(userId, productId);
  },
};

module.exports = WishlistService; 