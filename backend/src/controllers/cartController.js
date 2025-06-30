const CartService = require('../services/cartService');

const CartController = {
  async getCart(req, res, next) {
    try {
      const userId = req.user.id;
      const cart = await CartService.getCart(userId);
      res.json(cart);
    } catch (err) {
      console.error('Error in getCart:', err);
      next(err);
    }
  },
  async addToCart(req, res, next) {
    try {
      const userId = req.user.id;
      const { productId, quantity } = req.body;
      const item = await CartService.addToCart(userId, productId, quantity);
      res.status(201).json(item);
    } catch (err) {
      next(err);
    }
  },
  async updateCartItem(req, res, next) {
    try {
      const { quantity } = req.body;
      const item = await CartService.updateCartItem(req.params.itemId, quantity);
      res.json(item);
    } catch (err) {
      next(err);
    }
  },
  async removeCartItem(req, res, next) {
    try {
      await CartService.removeCartItem(req.params.itemId);
      res.json({ message: 'Cart item removed' });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = CartController; 