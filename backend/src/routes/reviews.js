const express = require('express');
const router = express.Router();
const ReviewController = require('../controllers/reviewController');
const authMiddleware = require('../middlewares/authMiddleware');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

// Public: Get reviews for a product
router.get('/product/:productId', ReviewController.getReviewsByProduct);
// Public: Get reviews by user
router.get('/user/:userId', ReviewController.getReviewsByUser);

// Admin: Get all reviews, approve, reject
router.get('/', authMiddleware, ReviewController.getAllReviews);
router.post('/:id/approve', authMiddleware, ReviewController.approveReview);
router.post('/:id/reject', authMiddleware, ReviewController.rejectReview);

// Protected: Create, update, delete review (user must be logged in)
router.post('/', authMiddleware, upload.none(), ReviewController.createReview);
router.put('/:id', authMiddleware, upload.none(), ReviewController.updateReview);
router.delete('/:id', authMiddleware, ReviewController.deleteReview);

module.exports = router; 