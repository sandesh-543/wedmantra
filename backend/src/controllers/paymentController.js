const PaymentService = require('../services/paymentService');

const PaymentController = {
  // Create Razorpay order
  async createRazorpayOrder(req, res, next) {
    try {
      const { orderId, amount, currency, receipt } = req.body;
      const order = await PaymentService.createRazorpayOrder(orderId, amount, currency, receipt);
      res.json(order);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  },

  // Verify Razorpay payment
  async verifyRazorpayPayment(req, res, next) {
    try {
      const { orderId, paymentId, signature } = req.body;
      const isValid = PaymentService.verifyRazorpaySignature(orderId, paymentId, signature);
      if (!isValid) {
        return res.status(400).json({ message: 'Invalid payment signature' });
      }
      // Update payment status to completed
      const payment = await PaymentService.getPaymentByRazorpayOrderId(orderId);
      if (payment) {
        await PaymentService.updatePaymentStatus(payment.id, 'completed', { paymentId, signature });
      }
      res.json({ message: 'Payment verified successfully' });
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  },

  // Initiate COD
  async initiateCOD(req, res, next) {
    try {
      const { orderId, amount, userPhone } = req.body;
      const result = await PaymentService.initiateCOD(orderId, amount, userPhone);
      res.json(result);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  },

  // Verify COD OTP
  async verifyCODOtp(req, res, next) {
    try {
      const { orderId, userPhone, otp } = req.body;
      const result = await PaymentService.verifyCODOtp(orderId, userPhone, otp);
      res.json(result);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  },

  // Initiate UPI intent
  async initiateUPIIntent(req, res, next) {
    try {
      const { orderId, amount, upiId } = req.body;
      const payment = await PaymentService.initiateUPIIntent(orderId, amount, upiId);
      res.json(payment);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  },

  // Get payment status
  async getPaymentStatus(req, res, next) {
    try {
      const payment = await PaymentService.getPaymentById(req.params.paymentId);
      if (!payment) {
        return res.status(404).json({ message: 'Payment not found' });
      }
      res.json(payment);
    } catch (err) {
      next(err);
    }
  },

  // Get payments by order
  async getPaymentsByOrder(req, res, next) {
    try {
      const payments = await PaymentService.getPaymentsByOrder(req.params.orderId);
      res.json(payments);
    } catch (err) {
      next(err);
    }
  },

  // Razorpay webhook
  async razorpayWebhook(req, res, next) {
    try {
      const { event, payload } = req.body;
      // Handle different webhook events
      if (event === 'payment.captured') {
        const payment = await PaymentService.getPaymentByRazorpayOrderId(payload.payment.entity.order_id);
        if (payment) {
          await PaymentService.updatePaymentStatus(payment.id, 'completed', payload);
        }
      }
      res.json({ received: true });
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  },
};

module.exports = PaymentController; 