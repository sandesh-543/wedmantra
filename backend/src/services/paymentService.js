const PaymentModel = require('../models/paymentModel');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const { sendOtpToPhone, verifyOtp } = require('../utils/otpUtils'); // You will need to implement this utility

const HIGH_VALUE_COD_THRESHOLD = 5000;

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const PaymentService = {
  // Initiate Razorpay payment (UPI, card, netbanking)
  async createRazorpayOrder(orderId, amount, currency = 'INR', receipt = null) {
    const options = {
      amount: Math.round(amount * 100), // Razorpay expects paise
      currency,
      receipt: receipt || `order_${orderId}`,
      payment_capture: 1,
    };
    const order = await razorpay.orders.create(options);
    return order;
  },

  // Verify Razorpay payment signature
  verifyRazorpaySignature(orderId, paymentId, signature) {
    const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
    hmac.update(orderId + '|' + paymentId);
    const generatedSignature = hmac.digest('hex');
    return generatedSignature === signature;
  },

  // Store payment attempt
  async recordPaymentAttempt(paymentData) {
    return await PaymentModel.create(paymentData);
  },

  // Update payment status
  async updatePaymentStatus(paymentId, status, gatewayResponse = null) {
    return await PaymentModel.updateStatus(paymentId, status, gatewayResponse);
  },

  // Get payment(s) by order
  async getPaymentsByOrder(orderId) {
    return await PaymentModel.getByOrderId(orderId);
  },

  // COD logic (with OTP for high value)
  async initiateCOD(orderId, amount, userPhone) {
    let otpSent = false;
    if (amount >= HIGH_VALUE_COD_THRESHOLD) {
      // Send OTP to user
      await sendOtpToPhone(userPhone, orderId);
      otpSent = true;
    }
    // Record payment as pending
    const payment = await PaymentModel.create({
      order_id: orderId,
      payment_method: 'cod',
      amount,
      status: otpSent ? 'pending_otp' : 'pending',
      currency: 'INR',
      gateway_response: null,
      transaction_id: null,
      razorpay_payment_id: null,
      razorpay_order_id: null,
    });
    return { payment, otpSent };
  },

  // Verify COD OTP
  async verifyCODOtp(orderId, userPhone, otp) {
    const valid = await verifyOtp(userPhone, orderId, otp);
    if (!valid) throw new Error('Invalid OTP');
    // Update payment status to pending (COD confirmed)
    const payments = await PaymentModel.getByOrderId(orderId);
    const codPayment = payments.find(p => p.payment_method === 'cod' && p.status === 'pending_otp');
    if (!codPayment) throw new Error('COD payment not found');
    await PaymentModel.updateStatus(codPayment.id, 'pending', null);
    return { message: 'COD verified' };
  },

  // UPI intent (deep link)
  async initiateUPIIntent(orderId, amount, upiId) {
    // Just record the attempt, actual payment is handled by the UPI app
    const payment = await PaymentModel.create({
      order_id: orderId,
      payment_method: 'upi_intent',
      amount,
      status: 'pending',
      currency: 'INR',
      gateway_response: null,
      transaction_id: null,
      razorpay_payment_id: null,
      razorpay_order_id: null,
    });
    return payment;
  },

  // Get payment by ID
  async getPaymentById(paymentId) {
    return await PaymentModel.getById(paymentId);
  },

  // Get payment by Razorpay order ID
  async getPaymentByRazorpayOrderId(razorpayOrderId) {
    return await PaymentModel.getByRazorpayOrderId(razorpayOrderId);
  },
};

module.exports = PaymentService; 