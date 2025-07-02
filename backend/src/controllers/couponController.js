const CouponService = require('../services/couponService');

const CouponController = {
  // Public: Validate coupon code
  async validateCoupon(req, res, next) {
    try {
      const { code, cartTotal, userId, cartItems } = req.body;
      const result = await CouponService.validateCoupon(code, cartTotal, userId, cartItems);
      res.json(result);
    } catch (err) {
      res.status(400).json({ valid: false, message: err.message });
    }
  },

  // Public: Get all active coupons
  async getActiveCoupons(req, res, next) {
    try {
      const coupons = await CouponService.getActiveCoupons();
      res.json(coupons);
    } catch (err) {
      next(err);
    }
  },

  // Protected: Apply coupon (requires user/order context)
  async applyCoupon(req, res, next) {
    try {
      const { code, userId, cartTotal, cartItems, orderId } = req.body;
      const result = await CouponService.applyCoupon(code, userId, cartTotal, cartItems, orderId);
      res.json(result);
    } catch (err) {
      res.status(400).json({ valid: false, message: err.message });
    }
  },

  // Admin: CRUD
  async createCoupon(req, res, next) {
    try {
      const coupon = await CouponService.createCoupon(req.body);
      res.status(201).json(coupon);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  },
  async updateCoupon(req, res, next) {
    try {
      const coupon = await CouponService.updateCoupon(req.params.id, req.body);
      res.json(coupon);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  },
  async deleteCoupon(req, res, next) {
    try {
      const result = await CouponService.deleteCoupon(req.params.id, req.body.code);
      res.json(result);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  },
};

module.exports = CouponController; 