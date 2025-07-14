const AddressService = require('../services/addressService');

const AddressController = {
  // Get all addresses for logged-in user
  async getUserAddresses(req, res, next) {
    try {
      const addresses = await AddressService.getUserAddresses(req.user.id);
      res.json({
        success: true,
        data: addresses,
        count: addresses.length
      });
    } catch (err) {
      next(err);
    }
  },

  // Get specific address
  async getAddressById(req, res, next) {
    try {
      const address = await AddressService.getAddressById(req.params.id, req.user.id);
      res.json({
        success: true,
        data: address
      });
    } catch (err) {
      if (err.message === 'Address not found') {
        return res.status(404).json({
          success: false,
          message: err.message
        });
      }
      next(err);
    }
  },

  // Create new address
  async createAddress(req, res, next) {
    try {
      const address = await AddressService.createAddress(req.user.id, req.body);
      res.status(201).json({
        success: true,
        message: 'Address created successfully',
        data: address
      });
    } catch (err) {
      if (err.message.includes('Required fields') || err.message.includes('valid')) {
        return res.status(400).json({
          success: false,
          message: err.message
        });
      }
      next(err);
    }
  },

  // Update address
  async updateAddress(req, res, next) {
    try {
      const address = await AddressService.updateAddress(req.params.id, req.user.id, req.body);
      res.json({
        success: true,
        message: 'Address updated successfully',
        data: address
      });
    } catch (err) {
      if (err.message === 'Address not found') {
        return res.status(404).json({
          success: false,
          message: err.message
        });
      }
      if (err.message.includes('valid')) {
        return res.status(400).json({
          success: false,
          message: err.message
        });
      }
      next(err);
    }
  },

  // Delete address
  async deleteAddress(req, res, next) {
    try {
      const result = await AddressService.deleteAddress(req.params.id, req.user.id);
      res.json({
        success: true,
        message: result.message
      });
    } catch (err) {
      if (err.message === 'Address not found') {
        return res.status(404).json({
          success: false,
          message: err.message
        });
      }
      next(err);
    }
  },

  // Set default address
  async setDefaultAddress(req, res, next) {
    try {
      const address = await AddressService.setDefaultAddress(req.params.id, req.user.id);
      res.json({
        success: true,
        message: 'Default address updated successfully',
        data: address
      });
    } catch (err) {
      if (err.message === 'Address not found') {
        return res.status(404).json({
          success: false,
          message: err.message
        });
      }
      next(err);
    }
  },

  // Get default address
  async getDefaultAddress(req, res, next) {
    try {
      const address = await AddressService.getDefaultAddress(req.user.id);
      if (!address) {
        return res.status(404).json({
          success: false,
          message: 'No default address found'
        });
      }
      res.json({
        success: true,
        data: address
      });
    } catch (err) {
      next(err);
    }
  }
};

module.exports = AddressController;