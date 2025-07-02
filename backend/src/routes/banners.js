const express = require('express');
const router = express.Router();
const BannerController = require('../controllers/bannerController');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

// Public: Get all active banners (with optional type)
router.get('/', BannerController.getAllBanners);
router.get('/:id', BannerController.getBannerById);

// Admin: Create, update, delete banners (no role check for now)
router.post('/', upload.single('image'), BannerController.createBanner);
router.put('/:id', upload.single('image'), BannerController.updateBanner);
router.delete('/:id', BannerController.deleteBanner);

module.exports = router; 