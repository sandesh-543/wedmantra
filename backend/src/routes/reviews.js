const express = require('express');
const router = express.Router();
const ReviewController = require('../controllers/reviewController');
const { authenticate, authorize } = require('../middlewares/authMiddleware');
const multer = require('multer');
const upload = multer();

// Public: Get reviews for a product
router.get('/product/:productId', ReviewController.getProductReviews);
// Public: Get reviews by user
router.get('/user/:userId', ReviewController.getReviewsByUser);

// Admin: Get all reviews, approve, reject
router.get('/', authenticate, authorize(['admin', 'superadmin']), ReviewController.getAllReviews);
router.post('/:id/approve', authenticate, authorize(['admin', 'superadmin']), ReviewController.approveReview);
router.post('/:id/reject', authenticate, authorize(['admin', 'superadmin']), ReviewController.rejectReview);

// Protected: Create, update, delete review (user must be logged in)
router.post('/', authenticate, upload.none(), ReviewController.createReview);
router.put('/:id', authenticate, upload.none(), ReviewController.updateReview);
router.delete('/:id', authenticate, ReviewController.deleteReview);

module.exports = router; 