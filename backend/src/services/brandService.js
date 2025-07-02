const BrandModel = require('../models/brandModel');

const BrandService = {
  async getAllBrands() {
    return await BrandModel.getAll();
  },
  async getBrandById(id) {
    if (!id) throw new Error('Brand ID is required');
    const brand = await BrandModel.getById(id);
    if (!brand) throw new Error('Brand not found');
    return brand;
  },
  async createBrand(data) {
    if (!data.name || !data.slug) throw new Error('Missing required brand fields');
    return await BrandModel.create(data);
  },
  async updateBrand(id, data) {
    if (!id) throw new Error('Brand ID is required');
    if (!data.name || !data.slug) throw new Error('Missing required brand fields');
    return await BrandModel.update(id, data);
  },
  async deleteBrand(id) {
    if (!id) throw new Error('Brand ID is required');
    return await BrandModel.delete(id);
  },
};

module.exports = BrandService; 