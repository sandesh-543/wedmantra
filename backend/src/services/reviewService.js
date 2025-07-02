const ReviewModel = require('../models/reviewModel');
const Filter = require('bad-words');
const filter = new Filter();

const ReviewService = {
  async createReview(data) {
    // Profanity check
    let isApproved = true;
    if (filter.isProfane(data.review || '') || filter.isProfane(data.title || '')) {
      isApproved = false;
    }
    // Optionally, add more checks (length, spam, etc.)
    const review = await ReviewModel.createReview({
      ...data,
      is_approved: isApproved,
    });
    return review;
  },

  async updateReview(id, data) {
    // Profanity check on update
    let isApproved = true;
    if (filter.isProfane(data.review || '') || filter.isProfane(data.title || '')) {
      isApproved = false;
    }
    const review = await ReviewModel.updateReview(id, {
      ...data,
      is_approved: isApproved,
    });
    return review;
  },

  async deleteReview(id) {
    return ReviewModel.deleteReview(id);
  },

  async getReviewById(id) {
    return ReviewModel.getReviewById(id);
  },

  async getReviewsByProduct(product_id, options) {
    return ReviewModel.getReviewsByProduct(product_id, options);
  },

  async getReviewsByUser(user_id) {
    return ReviewModel.getReviewsByUser(user_id);
  },

  async getAllReviews(filter) {
    return ReviewModel.getAllReviews(filter);
  },

  async approveReview(id) {
    return ReviewModel.updateReview(id, { is_approved: true });
  },

  async rejectReview(id) {
    return ReviewModel.updateReview(id, { is_approved: false });
  },
};

module.exports = ReviewService; 