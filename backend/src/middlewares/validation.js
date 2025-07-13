const { body, param, query, validationResult } = require('express-validator');

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(error => ({
        field: error.path,
        message: error.msg,
        value: error.value
      }))
    });
  }
  next();
};

// User Registration Validation
const validateUserRegistration = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .isLength({ min: 6, max: 128 })
    .withMessage('Password must be between 6 and 128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  body('first_name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('First name can only contain letters and spaces'),
  body('last_name')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Last name must be less than 50 characters')
    .matches(/^[a-zA-Z\s]*$/)
    .withMessage('Last name can only contain letters and spaces'),
  body('phone')
    .optional()
    .isMobilePhone('en-IN')
    .withMessage('Please provide a valid Indian phone number'),
  handleValidationErrors
];

// User Login Validation
const validateUserLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors
];

// Product Creation Validation
const validateProductCreation = [
  body('name')
    .trim()
    .isLength({ min: 3, max: 255 })
    .withMessage('Product name must be between 3 and 255 characters')
    .escape(),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 5000 })
    .withMessage('Description must be less than 5000 characters')
    .escape(),
  body('short_description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Short description must be less than 500 characters')
    .escape(),
  body('price')
    .isFloat({ min: 0.01, max: 1000000 })
    .withMessage('Price must be between 0.01 and 1,000,000'),
  body('sale_price')
    .optional()
    .isFloat({ min: 0.01, max: 1000000 })
    .withMessage('Sale price must be between 0.01 and 1,000,000')
    .custom((value, { req }) => {
      if (value && value >= req.body.price) {
        throw new Error('Sale price must be less than regular price');
      }
      return true;
    }),
  body('category_id')
    .isInt({ min: 1 })
    .withMessage('Valid category ID is required'),
  body('subcategory_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Subcategory ID must be a valid number'),
  body('brand_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Brand ID must be a valid number'),
  body('stock_quantity')
    .isInt({ min: 0 })
    .withMessage('Stock quantity must be a non-negative integer'),
  body('fabric')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Fabric must be less than 100 characters')
    .escape(),
  body('work_type')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Work type must be less than 100 characters')
    .escape(),
  body('occasion')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Occasion must be less than 100 characters')
    .escape(),
  body('region')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Region must be less than 100 characters')
    .escape(),
  body('length')
    .optional()
    .isFloat({ min: 0.1, max: 50 })
    .withMessage('Length must be between 0.1 and 50 meters'),
  body('blouse_piece')
    .optional()
    .isBoolean()
    .withMessage('Blouse piece must be true or false'),
  body('featured')
    .optional()
    .isBoolean()
    .withMessage('Featured must be true or false'),
  body('status')
    .optional()
    .isIn(['active', 'inactive', 'draft'])
    .withMessage('Status must be active, inactive, or draft'),
  handleValidationErrors
];

// Product Update Validation (similar to creation but optional fields)
const validateProductUpdate = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 3, max: 255 })
    .withMessage('Product name must be between 3 and 255 characters')
    .escape(),
  body('price')
    .optional()
    .isFloat({ min: 0.01, max: 1000000 })
    .withMessage('Price must be between 0.01 and 1,000,000'),
  body('sale_price')
    .optional()
    .isFloat({ min: 0.01, max: 1000000 })
    .withMessage('Sale price must be between 0.01 and 1,000,000'),
  body('stock_quantity')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Stock quantity must be a non-negative integer'),
  body('status')
    .optional()
    .isIn(['active', 'inactive', 'draft'])
    .withMessage('Status must be active, inactive, or draft'),
  handleValidationErrors
];

// Order Creation Validation
const validateOrderCreation = [
  body('items')
    .isArray({ min: 1 })
    .withMessage('Order must contain at least one item'),
  body('items.*.product_id')
    .isInt({ min: 1 })
    .withMessage('Valid product ID is required for each item'),
  body('items.*.quantity')
    .isInt({ min: 1, max: 99 })
    .withMessage('Quantity must be between 1 and 99'),
  body('shipping_full_name')
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Shipping name must be between 3 and 200 characters')
    .escape(),
  body('shipping_phone')
    .isMobilePhone('en-IN')
    .withMessage('Please provide a valid Indian phone number'),
  body('shipping_address_line1')
    .trim()
    .isLength({ min: 10, max: 255 })
    .withMessage('Address line 1 must be between 10 and 255 characters')
    .escape(),
  body('shipping_city')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('City must be between 2 and 100 characters')
    .escape(),
  body('shipping_state')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('State must be between 2 and 100 characters')
    .escape(),
  body('shipping_pincode')
    .matches(/^[1-9][0-9]{5}$/)
    .withMessage('Please provide a valid Indian pincode'),
  handleValidationErrors
];

// Search Query Validation
const validateSearchQuery = [
  query('q')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Search query must be less than 100 characters')
    .escape(),
  query('category_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Category ID must be a valid number'),
  query('min_price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum price must be a positive number'),
  query('max_price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Maximum price must be a positive number'),
  query('page')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Page must be between 1 and 1000'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  handleValidationErrors
];

// ID Parameter Validation
const validateIdParam = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID must be a positive integer'),
  handleValidationErrors
];

// Cart Item Validation
const validateCartItem = [
  body('product_id')
    .isInt({ min: 1 })
    .withMessage('Valid product ID is required'),
  body('quantity')
    .isInt({ min: 1, max: 99 })
    .withMessage('Quantity must be between 1 and 99'),
  handleValidationErrors
];

// Update Cart Item Validation
const validateCartItemUpdate = [
  body('quantity')
    .isInt({ min: 1, max: 99 })
    .withMessage('Quantity must be between 1 and 99'),
  handleValidationErrors
];

// Wishlist Item Validation
const validateWishlistItem = [
  body('productId')
    .isInt({ min: 1 })
    .withMessage('Valid product ID is required'),
  handleValidationErrors
];

// Category Validation
const validateCategory = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Category name must be between 2 and 100 characters')
    .escape(),
  body('slug')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Category slug must be between 2 and 100 characters')
    .matches(/^[a-z0-9-]+$/)
    .withMessage('Slug can only contain lowercase letters, numbers, and hyphens'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must be less than 500 characters')
    .escape(),
  body('parent_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Parent ID must be a valid number'),
  body('sort_order')
    .optional()
    .isInt({ min: 0, max: 9999 })
    .withMessage('Sort order must be between 0 and 9999'),
  handleValidationErrors
];

// Brand Validation
const validateBrand = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Brand name must be between 2 and 100 characters')
    .escape(),
  body('slug')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Brand slug must be between 2 and 100 characters')
    .matches(/^[a-z0-9-]+$/)
    .withMessage('Slug can only contain lowercase letters, numbers, and hyphens'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must be less than 500 characters')
    .escape(),
  handleValidationErrors
];

// OTP Validation
const validateOTP = [
  body('otp')
    .isLength({ min: 4, max: 6 })
    .withMessage('OTP must be 4-6 digits')
    .isNumeric()
    .withMessage('OTP must contain only numbers'),
  handleValidationErrors
];

// Phone Validation
const validatePhone = [
  body('phone')
    .isMobilePhone('en-IN')
    .withMessage('Please provide a valid Indian phone number'),
  handleValidationErrors
];

// Email Validation
const validateEmail = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  handleValidationErrors
];

module.exports = {
  validateUserRegistration,
  validateUserLogin,
  validateProductCreation,
  validateProductUpdate,
  validateOrderCreation,
  validateSearchQuery,
  validateIdParam,
  validateCartItem,
  validateCartItemUpdate,
  validateWishlistItem,
  validateCategory,
  validateBrand,
  validateOTP,
  validatePhone,
  validateEmail,
  handleValidationErrors
};