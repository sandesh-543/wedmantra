const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const { authenticate } = require('../middlewares/authMiddleware');
const { 
  validateUserRegistration, 
  validateUserLogin, 
  validateEmail, 
  validateOTP, 
  validatePhone 
} = require('../middlewares/validation');

// Public routes with validation
router.post('/register', validateUserRegistration, AuthController.register);
router.post('/login', validateUserLogin, AuthController.login);
router.post('/send-password-reset-otp', validateEmail, AuthController.sendPasswordResetOTP);
router.post('/verify-password-reset-otp', validateEmail, validateOTP, AuthController.verifyPasswordResetOTP);
router.post('/reset-password', validateEmail, validateOTP, AuthController.resetPassword);

// Protected routes
router.use(authenticate);
router.get('/profile', AuthController.getProfile);
router.put('/profile', AuthController.updateProfile);
router.post('/send-phone-verification-otp', validatePhone, AuthController.sendPhoneVerificationOTP);
router.post('/verify-phone-otp', validatePhone, validateOTP, AuthController.verifyPhoneOTP);
router.post('/change-password', AuthController.changePassword);

module.exports = router;