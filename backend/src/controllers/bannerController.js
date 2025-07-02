const BannerService = require('../services/bannerService');

const BannerController = {
  // Create a new banner
  async createBanner(req, res, next) {
    try {
      const banner = await BannerService.createBanner(req.body, req.file);
      res.status(201).json(banner);
    } catch (err) {
      next(err);
    }
  },

  // Update a banner
  async updateBanner(req, res, next) {
    try {
      const banner = await BannerService.updateBanner(req.params.id, req.body, req.file);
      res.json(banner);
    } catch (err) {
      next(err);
    }
  },

  // Delete a banner
  async deleteBanner(req, res, next) {
    try {
      await BannerService.deleteBanner(req.params.id);
      res.json({ message: 'Banner deleted' });
    } catch (err) {
      next(err);
    }
  },

  // Get all banners (admin or filtered)
  async getAllBanners(req, res, next) {
    try {
      const { activeOnly, type } = req.query;
      const banners = await BannerService.getAllBanners({
        activeOnly: activeOnly === 'true',
        type,
        now: new Date(),
      });
      res.json(banners);
    } catch (err) {
      next(err);
    }
  },

  // Get a single banner by ID
  async getBannerById(req, res, next) {
    try {
      const banner = await BannerService.getBannerById(req.params.id);
      if (!banner) return res.status(404).json({ message: 'Banner not found' });
      res.json(banner);
    } catch (err) {
      next(err);
    }
  },
};

module.exports = BannerController; 