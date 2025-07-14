const express = require('express');
const router = express.Router();
const AddressController = require('../controllers/addressController');
const { authenticate } = require('../middlewares/authMiddleware');
const { validateIdParam } = require('../middlewares/validation');

// All address routes require authentication
router.use(authenticate);

// Get all addresses for user
router.get('/', AddressController.getUserAddresses);

// Get default address
router.get('/default', AddressController.getDefaultAddress);

// Get specific address
router.get('/:id', validateIdParam, AddressController.getAddressById);

// Create new address
router.post('/', AddressController.createAddress);

// Update address
router.put('/:id', validateIdParam, AddressController.updateAddress);

// Delete address
router.delete('/:id', validateIdParam, AddressController.deleteAddress);

// Set default address
router.patch('/:id/default', validateIdParam, AddressController.setDefaultAddress);

module.exports = router;