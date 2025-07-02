const CouponModel = require('../models/couponModel');
const ProductModel = require('../models/productModel');

const CouponService = {
  // Validate coupon code (public, no login required)
  async validateCoupon(code, cartTotal, userId = null, cartItems = []) {
    const coupon = await CouponModel.getByCode(code);
    if (!coupon) throw new Error('Coupon not found');
    if (!coupon.is_active) throw new Error('Coupon is not active');

    const now = new Date();
    if (now < coupon.valid_from || now > coupon.valid_until) throw new Error('Coupon is not valid at this time');

    // Min order value
    if (cartTotal < parseFloat(coupon.minimum_amount)) throw new Error(`Minimum order amount for this coupon is ${coupon.minimum_amount}`);

    // Usage limits
    if (userId) {
      const userUsage = await CouponModel.getUsageByUser(coupon.id, userId);
      if (coupon.usage_limit && userUsage >= coupon.usage_limit) throw new Error('Coupon usage limit reached for this user');
    }
    const totalUsage = await CouponModel.getTotalUsage(coupon.id);
    if (coupon.usage_limit && totalUsage >= coupon.usage_limit) throw new Error('Coupon usage limit reached');

    // Eligible categories/products (if implemented in schema)
    // TODO: If you add eligible categories/products, check here

    // Calculate discount
    let discount = 0;
    if (coupon.type === 'percentage') {
      discount = (cartTotal * parseFloat(coupon.value)) / 100;
      if (coupon.maximum_discount && discount > parseFloat(coupon.maximum_discount)) {
        discount = parseFloat(coupon.maximum_discount);
      }
    } else if (coupon.type === 'fixed_amount') {
      discount = parseFloat(coupon.value);
      if (coupon.maximum_discount && discount > parseFloat(coupon.maximum_discount)) {
        discount = parseFloat(coupon.maximum_discount);
      }
    }
    if (discount > cartTotal) discount = cartTotal;

    return {
      valid: true,
      coupon,
      discount,
      message: 'Coupon is valid',
    };
  },

  // Apply coupon (requires user and order context)
  async applyCoupon(code, userId, cartTotal, cartItems, orderId) {
    // Validate coupon
    const validation = await this.validateCoupon(code, cartTotal, userId, cartItems);
    if (!validation.valid) throw new Error(validation.message);
    // Track usage
    await CouponModel.addUsage(validation.coupon.id, userId, orderId, validation.discount);
    return validation;
  },

  // Get all active coupons (for display)
  async getActiveCoupons() {
    return await CouponModel.getAllActive();
  },

  // Admin CRUD
  async createCoupon(data) {
    // TODO: Add admin validation if needed
    return await CouponModel.create(data);
  },
  async updateCoupon(id, data) {
    // TODO: Add admin validation if needed
    return await CouponModel.update(id, data);
  },
  async deleteCoupon(id, code) {
    return await CouponModel.delete(id, code);
  },
};

module.exports = CouponService; 