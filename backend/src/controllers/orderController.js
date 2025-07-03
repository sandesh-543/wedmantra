const OrderService = require('../services/orderService');
const PaymentService = require('../services/paymentService');

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
      
      // Check if user owns this order or is admin
      if (order.user_id !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'superadmin') {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      res.json(order);
    } catch (err) {
      next(err);
    }
  },
  async updateOrderStatus(req, res, next) {
    try {
      // Only admins can update order status
      if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      const order = await OrderService.updateOrderStatus(req.params.id, req.body.status, req.body.notes);
      res.json(order);
    } catch (err) {
      next(err);
    }
  },
  // Payment integration
  async processPayment(req, res, next) {
    try {
      const { orderId } = req.params;
      const { paymentMethod, paymentData } = req.body;

      let paymentResult;
      
      switch (paymentMethod) {
        case 'razorpay':
          paymentResult = await PaymentService.processRazorpayPayment(orderId, paymentData);
          break;
        case 'cod':
          paymentResult = await PaymentService.initiateCOD(orderId, paymentData.amount, req.user.phone);
          break;
        case 'upi':
          paymentResult = await PaymentService.createUPIIntent(orderId, paymentData);
          break;
        default:
          return res.status(400).json({ message: 'Invalid payment method' });
      }

      const processedOrder = await OrderService.processOrder(orderId, {
        method: paymentMethod,
        status: paymentResult.payment.status,
        gateway_response: paymentResult.payment.gateway_response,
        transaction_id: paymentResult.payment.transaction_id,
        razorpay_payment_id: paymentResult.payment.razorpay_payment_id,
        razorpay_order_id: paymentResult.payment.razorpay_order_id
      });

      res.json(processedOrder);
    } catch (err) {
      next(err);
    }
  },

  async verifyPayment(req, res, next) {
    try {
      const { orderId } = req.params;
      const { paymentId, signature } = req.body;

      const verificationResult = await PaymentService.verifyRazorpayPayment(paymentId, signature);
      
      if (verificationResult.verified) {
        const processedOrder = await OrderService.processOrder(orderId, {
          method: 'razorpay',
          status: 'completed',
          gateway_response: verificationResult,
          transaction_id: paymentId
        });
        res.json(processedOrder);
      } else {
        res.status(400).json({ message: 'Payment verification failed' });
      }
    } catch (err) {
      next(err);
    }
  },

  // Order tracking
  async cancelOrder(req, res, next) {
    try {
      const order = await OrderService.getOrderById(req.params.id);
      if (!order) return res.status(404).json({ message: 'Order not found' });
      
      // Check if user owns this order or is admin
      if (order.user_id !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'superadmin') {
        return res.status(403).json({ message: 'Access denied' });
      }

      const cancelledOrder = await OrderService.cancelOrder(req.params.id, req.body.reason);
      res.json(cancelledOrder);
    } catch (err) {
      next(err);
    }
  },

  async getOrderItems(req, res, next) {
    try {
      const items = await OrderService.getOrderItems(req.params.orderId);
      res.json(items);
    } catch (err) {
      next(err);
    }
  },

  async addOrderItem(req, res, next) {
    try {
      const item = await OrderService.addOrderItem(req.params.orderId, req.body);
      res.status(201).json(item);
    } catch (err) {
      next(err);
    }
  },

  async updateOrderItem(req, res, next) {
    try {
      const item = await OrderService.updateOrderItem(req.params.itemId, req.body);
      res.json(item);
    } catch (err) {
      next(err);
    }
  },

  async removeOrderItem(req, res, next) {
    try {
      const item = await OrderService.removeOrderItem(req.params.itemId);
      res.json(item);
    } catch (err) {
      next(err);
    }
  },

  // Admin endpoints
  async getAllOrders(req, res, next) {
    try {
      if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
        return res.status(403).json({ message: 'Access denied' });
      }

      // For regular admins, show only their products' orders
      // For superadmin, show all orders
      const orders = req.user.role === 'superadmin' 
        ? await OrderService.getAllOrders()
        : await OrderService.getOrdersByAdmin(req.user.id);
      
      res.json(orders);
    } catch (err) {
      next(err);
    }
  }
};

module.exports = OrderController; 