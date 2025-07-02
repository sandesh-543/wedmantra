const BrandService = require('../services/brandService');

const BrandController = {
  async getAllBrands(req, res, next) {
    try {
      const brands = await BrandService.getAllBrands();
      res.json(brands);
    } catch (err) {
      next(err);
    }
  },
  async getBrandById(req, res, next) {
    try {
      const brand = await BrandService.getBrandById(req.params.id);
      res.json(brand);
    } catch (err) {
      if (err.message === 'Brand not found') {
        return res.status(404).json({ message: err.message });
      }
      res.status(400).json({ message: err.message });
    }
  },
  async createBrand(req, res, next) {
    try {
      const brand = await BrandService.createBrand(req.body);
      res.status(201).json(brand);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  },
  async updateBrand(req, res, next) {
    try {
      const brand = await BrandService.updateBrand(req.params.id, req.body);
      res.json(brand);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  },
  async deleteBrand(req, res, next) {
    try {
      const result = await BrandService.deleteBrand(req.params.id);
      res.json(result);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  },
};

module.exports = BrandController; 