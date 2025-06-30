const express = require('express');
const router = express.Router();
// const ReviewController = require('../controllers/reviewController');
// const authMiddleware = require('../middlewares/authMiddleware');

// router.use(authMiddleware); // Uncomment when auth is ready

// Get product reviews
router.get('/product/:productId', (req, res) => {
  // TODO: Implement get product reviews
  res.json({ message: 'Get product reviews endpoint' });
});

// Add review
router.post('/', (req, res) => {
  // TODO: Implement add review
  res.json({ message: 'Add review endpoint' });
});

// Update review
router.put('/:id', (req, res) => {
  // TODO: Implement update review
  res.json({ message: 'Update review endpoint' });
});

// Delete review
router.delete('/:id', (req, res) => {
  // TODO: Implement delete review
  res.json({ message: 'Delete review endpoint' });
});

module.exports = router; 