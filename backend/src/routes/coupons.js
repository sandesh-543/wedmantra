const express = require('express');
const router = express.Router();
const CouponController = require('../controllers/couponController');
// const authMiddleware = require('../middlewares/authMiddleware');
// const adminMiddleware = require('../middlewares/adminMiddleware');

// Public endpoints
router.post('/validate', CouponController.validateCoupon); // Validate coupon (public)
router.get('/', CouponController.getActiveCoupons); // Get all active coupons (public)

// Protected endpoints (user must be logged in)
router.post('/apply', /*authMiddleware,*/ CouponController.applyCoupon); // Apply coupon (protected)

// Admin endpoints (add adminMiddleware as needed)
router.post('/', /*adminMiddleware,*/ CouponController.createCoupon); // Create coupon
router.put('/:id', /*adminMiddleware,*/ CouponController.updateCoupon); // Update coupon
router.delete('/:id', /*adminMiddleware,*/ CouponController.deleteCoupon); // Delete coupon

module.exports = router; 