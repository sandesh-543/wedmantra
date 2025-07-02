const express = require('express');
const router = express.Router();
const PaymentController = require('../controllers/paymentController');
const authMiddleware = require('../middlewares/authMiddleware');

// Public routes
router.post('/razorpay/create-order', PaymentController.createRazorpayOrder);
router.post('/razorpay/verify', PaymentController.verifyRazorpayPayment);
router.post('/razorpay/webhook', PaymentController.razorpayWebhook);
router.post('/cod/initiate', PaymentController.initiateCOD);
router.post('/cod/verify-otp', PaymentController.verifyCODOtp);
router.post('/upi/initiate', PaymentController.initiateUPIIntent);

// Protected routes
router.get('/status/:paymentId', authMiddleware, PaymentController.getPaymentStatus);
router.get('/order/:orderId', authMiddleware, PaymentController.getPaymentsByOrder);

module.exports = router; 