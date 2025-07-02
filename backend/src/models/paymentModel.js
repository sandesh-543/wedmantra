const db = require('../config/db');
const { CacheService, CACHE_TTL } = require('../services/cacheService');

const PaymentModel = {
  async create(payment) {
    const result = await db.query(
      `INSERT INTO payments (order_id, payment_method, transaction_id, razorpay_payment_id, razorpay_order_id, amount, currency, status, gateway_response, created_at, updated_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW(),NOW()) RETURNING *`,
      [payment.order_id, payment.payment_method, payment.transaction_id, payment.razorpay_payment_id, payment.razorpay_order_id, payment.amount, payment.currency || 'INR', payment.status, payment.gateway_response]
    );
    await CacheService.del(`payment:order:${payment.order_id}`);
    return result.rows[0];
  },
  async updateStatus(paymentId, status, gatewayResponse = null) {
    const result = await db.query(
      `UPDATE payments SET status=$1, gateway_response=$2, updated_at=NOW() WHERE id=$3 RETURNING *`,
      [status, gatewayResponse, paymentId]
    );
    if (result.rows[0]) {
      await CacheService.del(`payment:order:${result.rows[0].order_id}`);
    }
    return result.rows[0];
  },
  async getByOrderId(orderId) {
    const cacheKey = `payment:order:${orderId}`;
    return await CacheService.cacheWrapper(cacheKey, async () => {
      const result = await db.query('SELECT * FROM payments WHERE order_id = $1 ORDER BY created_at DESC', [orderId]);
      return result.rows;
    }, CACHE_TTL.ORDERS);
  },
  async getById(id) {
    const result = await db.query('SELECT * FROM payments WHERE id = $1', [id]);
    return result.rows[0];
  },
  async getByRazorpayOrderId(razorpayOrderId) {
    const result = await db.query('SELECT * FROM payments WHERE razorpay_order_id = $1', [razorpayOrderId]);
    return result.rows[0];
  },
};

module.exports = PaymentModel; 