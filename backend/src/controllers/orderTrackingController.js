const OrderTrackingService = require('../services/orderTrackingService');

const OrderTrackingController = {
  // Get order tracking (user/admin)
  async getOrderTracking(req, res, next) {
    try {
      const { orderId } = req.params;
      const userId = req.user.role === 'customer' ? req.user.id : null;
      
      const tracking = await OrderTrackingService.getOrderTracking(orderId, userId);
      
      res.json({
        success: true,
        data: tracking
      });
    } catch (err) {
      if (err.message === 'Order not found') {
        return res.status(404).json({
          success: false,
          message: err.message
        });
      }
      next(err);
    }
  },

  // Public order tracking (no auth required)
  async getPublicTracking(req, res, next) {
    try {
      const { orderNumber } = req.params;
      const tracking = await OrderTrackingService.getPublicTracking(orderNumber);
      
      res.json({
        success: true,
        data: tracking
      });
    } catch (err) {
      if (err.message === 'Order not found') {
        return res.status(404).json({
          success: false,
          message: 'Order not found. Please check your order number.'
        });
      }
      next(err);
    }
  },

  // Update order status (admin only)
  async updateOrderStatus(req, res, next) {
    try {
      const { orderId } = req.params;
      const statusData = req.body;
      
      const updatedOrder = await OrderTrackingService.updateOrderStatus(
        orderId, 
        statusData, 
        req.user.id
      );
      
      res.json({
        success: true,
        message: 'Order status updated successfully',
        data: updatedOrder
      });
    } catch (err) {
      if (err.message.includes('Invalid') || err.message === 'Order not found') {
        return res.status(400).json({
          success: false,
          message: err.message
        });
      }
      next(err);
    }
  },

  // Get orders needing update (admin dashboard)
  async getOrdersNeedingUpdate(req, res, next) {
    try {
      const orders = await OrderTrackingService.getOrdersNeedingUpdate();
      
      res.json({
        success: true,
        data: orders,
        count: orders.length
      });
    } catch (err) {
      next(err);
    }
  }
};

module.exports = OrderTrackingController;