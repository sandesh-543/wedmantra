const express = require('express');
const router = express.Router();
// const BannerController = require('../controllers/bannerController');

// Get active banners
router.get('/', (req, res) => {
  // TODO: Implement get active banners
  res.json({ message: 'Get banners endpoint' });
});

// Get banner by type
router.get('/type/:type', (req, res) => {
  // TODO: Implement get banners by type
  res.json({ message: 'Get banners by type endpoint' });
});

// Admin routes (protected)
// router.post('/', authMiddleware, (req, res) => {
//   // TODO: Implement create banner
//   res.json({ message: 'Create banner endpoint' });
// });

// router.put('/:id', authMiddleware, (req, res) => {
//   // TODO: Implement update banner
//   res.json({ message: 'Update banner endpoint' });
// });

// router.delete('/:id', authMiddleware, (req, res) => {
//   // TODO: Implement delete banner
//   res.json({ message: 'Delete banner endpoint' });
// });

module.exports = router; 