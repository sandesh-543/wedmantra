const db = require('../config/db');

const ReviewModel = {
  async createReview({ product_id, user_id, order_id, rating, title, review, media_urls, media_types, is_verified_purchase, is_approved }) {
    const result = await db.query(
      `INSERT INTO product_reviews (product_id, user_id, order_id, rating, title, review, media_urls, media_types, is_verified_purchase, is_approved, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,NOW(),NOW()) RETURNING *`,
      [product_id, user_id, order_id, rating, title, review, media_urls, media_types, is_verified_purchase, is_approved]
    );
    return result.rows[0];
  },

  async updateReview(id, updates) {
    const fields = [];
    const values = [];
    let idx = 1;
    for (const key in updates) {
      fields.push(`${key} = $${idx}`);
      values.push(updates[key]);
      idx++;
    }
    values.push(id);
    const result = await db.query(
      `UPDATE product_reviews SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${idx} RETURNING *`,
      values
    );
    return result.rows[0];
  },

  async deleteReview(id) {
    await db.query('DELETE FROM product_reviews WHERE id = $1', [id]);
    return true;
  },

  async getReviewById(id) {
    const result = await db.query('SELECT * FROM product_reviews WHERE id = $1', [id]);
    return result.rows[0];
  },

  async getReviewsByProduct(product_id, { onlyApproved = true } = {}) {
    let query = 'SELECT * FROM product_reviews WHERE product_id = $1';
    const params = [product_id];
    if (onlyApproved) {
      query += ' AND is_approved = true';
    }
    query += ' ORDER BY created_at DESC';
    const result = await db.query(query, params);
    return result.rows;
  },

  async getReviewsByUser(user_id) {
    const result = await db.query('SELECT * FROM product_reviews WHERE user_id = $1 ORDER BY created_at DESC', [user_id]);
    return result.rows;
  },

  async getAllReviews({ is_approved } = {}) {
    let query = 'SELECT * FROM product_reviews';
    const params = [];
    if (typeof is_approved === 'boolean') {
      query += ' WHERE is_approved = $1';
      params.push(is_approved);
    }
    query += ' ORDER BY created_at DESC';
    const result = await db.query(query, params);
    return result.rows;
  },
};

module.exports = ReviewModel; 