const ReviewService = require('../services/reviewService');

const ReviewController = {
  // Create a new review
  async createReview(req, res, next) {
    try {
      const review = await ReviewService.createReview({
        ...req.body,
        user_id: req.user.id, // assuming auth middleware sets req.user
      });
      res.status(201).json(review);
    } catch (err) {
      next(err);
    }
  },

  // Update a review
  async updateReview(req, res, next) {
    try {
      const review = await ReviewService.updateReview(req.params.id, req.body);
      res.json(review);
    } catch (err) {
      next(err);
    }
  },

  // Delete a review
  async deleteReview(req, res, next) {
    try {
      await ReviewService.deleteReview(req.params.id);
      res.json({ message: 'Review deleted' });
    } catch (err) {
      next(err);
    }
  },

  // Get reviews for a product
  async getReviewsByProduct(req, res, next) {
    try {
      const reviews = await ReviewService.getReviewsByProduct(req.params.productId, { onlyApproved: req.query.onlyApproved !== 'false' });
      res.json(reviews);
    } catch (err) {
      next(err);
    }
  },

  // Get reviews by user
  async getReviewsByUser(req, res, next) {
    try {
      const reviews = await ReviewService.getReviewsByUser(req.params.userId);
      res.json(reviews);
    } catch (err) {
      next(err);
    }
  },

  // Get all reviews (admin)
  async getAllReviews(req, res, next) {
    try {
      const reviews = await ReviewService.getAllReviews({ is_approved: req.query.is_approved });
      res.json(reviews);
    } catch (err) {
      next(err);
    }
  },

  // Approve a review (admin)
  async approveReview(req, res, next) {
    try {
      const review = await ReviewService.approveReview(req.params.id);
      res.json(review);
    } catch (err) {
      next(err);
    }
  },

  // Reject a review (admin)
  async rejectReview(req, res, next) {
    try {
      const review = await ReviewService.rejectReview(req.params.id);
      res.json(review);
    } catch (err) {
      next(err);
    }
  },
};

module.exports = ReviewController; 