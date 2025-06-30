const CartModel = require('../models/cartModel');

const CartService = {
  async getCart(userId) {
    return await CartModel.getCartByUser(userId);
  },
  async addToCart(userId, productId, quantity) {
    return await CartModel.addItem(userId, productId, quantity);
  },
  async updateCartItem(itemId, quantity) {
    return await CartModel.updateItem(itemId, quantity);
  },
  async removeCartItem(itemId) {
    return await CartModel.removeItem(itemId);
  },
};

module.exports = CartService; 