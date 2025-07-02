const BannerModel = require('../models/bannerModel');
const cloudinaryService = require('./cloudinaryService');

const BannerService = {
  async createBanner(data, imageFile) {
    let imageUrl = data.image_url;
    if (imageFile) {
      const uploadResult = await cloudinaryService.uploadImage(imageFile.path, 'banners');
      imageUrl = uploadResult.secure_url;
    }
    return BannerModel.createBanner({ ...data, image_url: imageUrl });
  },

  async updateBanner(id, data, imageFile) {
    let updates = { ...data };
    if (imageFile) {
      const uploadResult = await cloudinaryService.uploadImage(imageFile.path, 'banners');
      updates.image_url = uploadResult.secure_url;
    }
    return BannerModel.updateBanner(id, updates);
  },

  async deleteBanner(id) {
    return BannerModel.deleteBanner(id);
  },

  async getBannerById(id) {
    return BannerModel.getBannerById(id);
  },

  async getAllBanners(filter) {
    return BannerModel.getAllBanners(filter);
  },
};

module.exports = BannerService; 