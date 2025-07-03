const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const { authenticate } = require('../middlewares/authMiddleware');

// Public routes
router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.post('/send-password-reset-otp', AuthController.sendPasswordResetOTP);
router.post('/verify-password-reset-otp', AuthController.verifyPasswordResetOTP);
router.post('/reset-password', AuthController.resetPassword);

// Protected routes
router.use(authenticate);
router.get('/profile', AuthController.getProfile);
router.put('/profile', AuthController.updateProfile);
router.post('/send-phone-verification-otp', AuthController.sendPhoneVerificationOTP);
router.post('/verify-phone-otp', AuthController.verifyPhoneOTP);
router.post('/change-password', AuthController.changePassword);

module.exports = router;
