const OrderService = require('../services/orderService');

const OrderController = {
  async createOrder(req, res, next) {
    try {
      const orderData = { ...req.body, user_id: req.user.id };
      const order = await OrderService.createOrder(orderData);
      res.status(201).json(order);
    } catch (err) {
      next(err);
    }
  },
  async getUserOrders(req, res, next) {
    try {
      const orders = await OrderService.getUserOrders(req.user.id);
      res.json(orders);
    } catch (err) {
      next(err);
    }
  },
  async getOrderById(req, res, next) {
    try {
      const order = await OrderService.getOrderById(req.params.id);
      if (!order) return res.status(404).json({ message: 'Order not found' });
      res.json(order);
    } catch (err) {
      next(err);
    }
  },
  async updateOrderStatus(req, res, next) {
    try {
      const order = await OrderService.updateOrderStatus(req.params.id, req.body.status);
      res.json(order);
    } catch (err) {
      next(err);
    }
  },
  // TODO: Add payment integration, order tracking
};

module.exports = OrderController; 