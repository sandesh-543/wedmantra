const express = require('express');
const router = express.Router();
const CouponController = require('../controllers/couponController');
const { authenticate, authorize } = require('../middlewares/authMiddleware');

// Public endpoints (validation only - no management)
router.post('/validate', CouponController.validateCoupon); // Validate coupon (public)
router.get('/active', CouponController.getActiveCoupons); // Get all active coupons (public)

// ALL COUPON MANAGEMENT IS ADMIN ONLY
router.use(authenticate);
router.use(authorize(['admin', 'superadmin']));

// Admin-only endpoints
router.get('/', CouponController.getAllCoupons); // Get all coupons (admin)
router.get('/:id', CouponController.getCouponById); // Get coupon by ID (admin)
router.post('/', CouponController.createCoupon); // Create coupon (admin)
router.put('/:id', CouponController.updateCoupon); // Update coupon (admin)
router.delete('/:id', CouponController.deleteCoupon); // Delete coupon (admin)
router.get('/:id/usage', CouponController.getCouponUsage); // Get usage stats (admin)

module.exports = router;