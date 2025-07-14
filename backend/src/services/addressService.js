const AddressModel = require('../models/addressModel');

const AddressService = {
  async getUserAddresses(userId) {
    return await AddressModel.getByUser(userId);
  },

  async getAddressById(id, userId) {
    const address = await AddressModel.getById(id, userId);
    if (!address) {
      throw new Error('Address not found');
    }
    return address;
  },

  async createAddress(userId, addressData) {
    // Validation
    if (!addressData.full_name || !addressData.phone || !addressData.address_line1 || 
        !addressData.city || !addressData.state || !addressData.pincode) {
      throw new Error('Required fields: full_name, phone, address_line1, city, state, pincode');
    }

    // Validate Indian pincode
    if (!/^[1-9][0-9]{5}$/.test(addressData.pincode)) {
      throw new Error('Please provide a valid Indian pincode');
    }

    // Validate phone number
    if (!/^[6-9]\d{9}$/.test(addressData.phone.replace(/[^\d]/g, ''))) {
      throw new Error('Please provide a valid Indian phone number');
    }

    return await AddressModel.create(userId, addressData);
  },

  async updateAddress(id, userId, addressData) {
    // Validate pincode if provided
    if (addressData.pincode && !/^[1-9][0-9]{5}$/.test(addressData.pincode)) {
      throw new Error('Please provide a valid Indian pincode');
    }

    // Validate phone if provided
    if (addressData.phone && !/^[6-9]\d{9}$/.test(addressData.phone.replace(/[^\d]/g, ''))) {
      throw new Error('Please provide a valid Indian phone number');
    }

    return await AddressModel.update(id, userId, addressData);
  },

  async deleteAddress(id, userId) {
    return await AddressModel.delete(id, userId);
  },

  async setDefaultAddress(id, userId) {
    return await AddressModel.setDefault(id, userId);
  },

  async getDefaultAddress(userId) {
    return await AddressModel.getDefault(userId);
  }
};

module.exports = AddressService;