/**
 * Common utilities for mobile API responses and formatting
 */

const MobileHelpers = {
  // Standard mobile response formatter
  mobileResponse: (data, message = 'Success') => ({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  }),

  // Standard mobile error formatter
  mobileError: (message, code = 500, data = null) => ({
    success: false,
    message,
    code,
    data,
    timestamp: new Date().toISOString()
  }),

  // Format product for mobile list view
  formatProductForList: (product, additionalData = {}) => ({
    id: product.id,
    name: product.name,
    price: product.price,
    salePrice: product.sale_price,
    image: product.image_url,
    fabric: product.fabric,
    inStock: product.stock_quantity > 0,
    discount: product.sale_price ? 
      Math.round(((product.price - product.sale_price) / product.price) * 100) : 0,
    badge: product.featured ? 'Featured' : product.sale_price ? 'Sale' : null,
    ...additionalData
  }),

  // Format product for mobile detail view
  formatProductForDetail: (product, userContext = {}, additionalData = {}) => ({
    id: product.id,
    name: product.name,
    description: product.description,
    shortDescription: product.short_description,
    price: product.price,
    salePrice: product.sale_price,
    sku: product.sku,
    
    // Product details
    details: {
      fabric: product.fabric,
      workType: product.work_type,
      occasion: product.occasion,
      region: product.region,
      length: product.length,
      blousePiece: product.blouse_piece,
      washCare: product.wash_care
    },
    
    // Stock and pricing
    stock: {
      available: product.stock_quantity > 0,
      quantity: product.stock_quantity,
      status: product.stock_status
    },
    
    // Calculated fields
    discount: product.sale_price ? 
      Math.round(((product.price - product.sale_price) / product.price) * 100) : 0,
    
    // User context
    userActions: {
      isWishlisted: userContext.isWishlisted || false,
      isInCart: userContext.isInCart || false,
      canReview: userContext.canReview || false,
      cartQuantity: userContext.cartQuantity || 0
    },
    
    // Delivery info
    delivery: {
      freeShipping: product.price >= 500,
      estimatedDays: MobileHelpers.calculateDeliveryDays(product.price),
      returnPolicy: '7 days return',
      cod: product.price <= 5000
    },
    
    ...additionalData
  }),

  // Format category for mobile
  formatCategoryForMobile: (category, productCount = 0) => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
    image: category.image_url || MobileHelpers.getPlaceholderImage(category.name),
    productCount
  }),

  // Calculate delivery days based on price/location
  calculateDeliveryDays: (price, userLocation = null) => {
    // Premium products (>5000) get faster delivery
    if (price > 5000) return '2-3 days';
    
    // TODO: Add location-based calculation
    // For now, return standard delivery
    return '3-5 days';
  },

  // Generate placeholder image URL
  getPlaceholderImage: (text, size = '150x150') => {
    const encodedText = encodeURIComponent(text);
    return `https://via.placeholder.com/${size}/f0f0f0/666?text=${encodedText}`;
  },

  // Calculate savings amount
  calculateSavings: (items) => {
    return items.reduce((total, item) => {
      if (item.sale_price && item.price > item.sale_price) {
        return total + ((item.price - item.sale_price) * (item.quantity || 1));
      }
      return total;
    }, 0);
  },

  // Format cart summary for mobile
  formatCartSummary: (cartItems, options = {}) => {
    const subtotal = cartItems.reduce((sum, item) => 
      sum + (item.sale_price || item.price) * item.quantity, 0);
    
    const shipping = subtotal >= (options.freeShippingLimit || 500) ? 0 : (options.shippingCost || 50);
    const tax = Math.round(subtotal * (options.taxRate || 0.18));
    const total = subtotal + shipping + tax;
    
    return {
      itemCount: cartItems.length,
      totalQuantity: cartItems.reduce((sum, item) => sum + item.quantity, 0),
      subtotal,
      shipping,
      tax,
      total,
      freeShippingAt: options.freeShippingLimit || 500,
      freeShippingRemaining: subtotal < (options.freeShippingLimit || 500) ? 
        (options.freeShippingLimit || 500) - subtotal : 0,
      savings: MobileHelpers.calculateSavings(cartItems),
      currency: options.currency || 'INR'
    };
  },

  // Validate mobile request parameters
  validateMobileParams: (req, rules) => {
    const errors = [];
    const params = { ...req.query, ...req.body, ...req.params };
    
    for (const [field, rule] of Object.entries(rules)) {
      const value = params[field];
      
      if (rule.required && (value === undefined || value === null || value === '')) {
        errors.push(`${field} is required`);
        continue;
      }
      
      if (value !== undefined && value !== null && value !== '') {
        if (rule.type === 'number') {
          const num = Number(value);
          if (isNaN(num)) {
            errors.push(`${field} must be a number`);
          } else if (rule.min !== undefined && num < rule.min) {
            errors.push(`${field} must be at least ${rule.min}`);
          } else if (rule.max !== undefined && num > rule.max) {
            errors.push(`${field} must be at most ${rule.max}`);
          }
        }
        
        if (rule.type === 'string') {
          if (rule.minLength && value.length < rule.minLength) {
            errors.push(`${field} must be at least ${rule.minLength} characters`);
          }
          if (rule.maxLength && value.length > rule.maxLength) {
            errors.push(`${field} must be at most ${rule.maxLength} characters`);
          }
        }
        
        if (rule.enum && !rule.enum.includes(value)) {
          errors.push(`${field} must be one of: ${rule.enum.join(', ')}`);
        }
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  },

  // Paginate results for mobile
  paginateResults: (data, page = 1, limit = 20) => {
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit))); // Max 100 items
    const total = data.length;
    const pages = Math.ceil(total / limitNum);
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    
    return {
      data: data.slice(startIndex, endIndex),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages,
        hasNext: pageNum < pages,
        hasPrev: pageNum > 1,
        nextPage: pageNum < pages ? pageNum + 1 : null,
        prevPage: pageNum > 1 ? pageNum - 1 : null
      }
    };
  },

  // Format search filters for mobile
  formatSearchFilters: () => ({
    fabrics: ['Cotton', 'Silk', 'Georgette', 'Chiffon', 'Crepe', 'Net', 'Velvet'],
    occasions: ['Wedding', 'Festival', 'Party', 'Casual', 'Office', 'Traditional'],
    regions: ['Banarasi', 'Kanchipuram', 'Bengali', 'Gujarati', 'Rajasthani', 'South Indian'],
    workTypes: ['Embroidery', 'Print', 'Plain', 'Zari Work', 'Sequin Work', 'Stone Work'],
    priceRanges: [
      { min: 0, max: 1000, label: 'Under ₹1,000' },
      { min: 1000, max: 3000, label: '₹1,000 - ₹3,000' },
      { min: 3000, max: 5000, label: '₹3,000 - ₹5,000' },
      { min: 5000, max: 10000, label: '₹5,000 - ₹10,000' },
      { min: 10000, max: null, label: 'Above ₹10,000' }
    ],
    sortOptions: [
      { value: 'newest', label: 'Newest First' },
      { value: 'price_asc', label: 'Price: Low to High' },
      { value: 'price_desc', label: 'Price: High to Low' },
      { value: 'name_asc', label: 'Name: A to Z' },
      { value: 'name_desc', label: 'Name: Z to A' },
      { value: 'popular', label: 'Most Popular' },
      { value: 'rating', label: 'Highest Rated' }
    ]
  }),

  // Format error for mobile API
  formatApiError: (error, req = null) => {
    // Log error for debugging
    console.error('Mobile API Error:', {
      message: error.message,
      stack: error.stack,
      url: req?.originalUrl,
      method: req?.method,
      userId: req?.user?.id,
      timestamp: new Date().toISOString()
    });

    // Return user-friendly error
    const isDevelopment = process.env.NODE_ENV !== 'production';
    
    return MobileHelpers.mobileError(
      isDevelopment ? error.message : 'Something went wrong. Please try again.',
      error.status || 500,
      isDevelopment ? { stack: error.stack } : null
    );
  },

  // Rate limiting helper for mobile APIs
  getMobileRateLimit: (req) => {
    const userId = req.user?.id;
    const deviceId = req.headers['x-device-id'];
    const ip = req.ip;
    
    // Use user ID if authenticated, device ID if available, otherwise IP
    return userId || deviceId || ip;
  },

  // Generate mobile-friendly URLs
  generateMobileUrls: (baseUrl, params = {}) => {
    const url = new URL(baseUrl);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        url.searchParams.set(key, value);
      }
    });
    return url.toString();
  },

  // Check if request is from mobile app
  isMobileApp: (req) => {
    const userAgent = req.headers['user-agent'] || '';
    const platform = req.headers['x-platform'];
    
    return platform === 'mobile' || 
           userAgent.includes('Mobile') || 
           userAgent.includes('Android') ||
           userAgent.includes('iPhone');
  },

  // Format notification data for mobile
  formatNotificationForMobile: (notification) => ({
    id: notification.id,
    title: notification.title,
    message: notification.message,
    type: notification.type,
    data: notification.data ? JSON.parse(notification.data) : {},
    isRead: notification.is_read,
    createdAt: notification.sent_at,
    readAt: notification.read_at
  }),

  // Sanitize user input for mobile
  sanitizeMobileInput: (input, type = 'string') => {
    if (input === null || input === undefined) return input;
    
    switch (type) {
      case 'string':
        return String(input).trim().slice(0, 1000); // Max 1000 chars
      case 'number':
        const num = Number(input);
        return isNaN(num) ? 0 : num;
      case 'boolean':
        return Boolean(input);
      case 'array':
        return Array.isArray(input) ? input.slice(0, 100) : []; // Max 100 items
      default:
        return input;
    }
  },

  // Generate cache keys for mobile APIs
  generateMobileCacheKey: (prefix, params = {}) => {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}:${params[key]}`)
      .join('|');
    
    return `mobile:${prefix}:${sortedParams}`;
  },

  // Format order for mobile
  formatOrderForMobile: (order) => ({
    id: order.id,
    orderNumber: order.order_number,
    status: order.status,
    paymentStatus: order.payment_status,
    total: order.total_amount,
    itemCount: order.items?.length || 0,
    createdAt: order.created_at,
    estimatedDelivery: MobileHelpers.calculateEstimatedDelivery(order),
    canCancel: ['pending', 'confirmed'].includes(order.status),
    canReturn: order.status === 'delivered' && MobileHelpers.canReturnOrder(order.delivered_at),
    trackingNumber: order.tracking_number
  }),

  // Calculate estimated delivery date
  calculateEstimatedDelivery: (order) => {
    if (order.status === 'delivered') return order.delivered_at;
    
    const orderDate = new Date(order.created_at);
    const estimatedDays = order.total_amount > 5000 ? 3 : 5; // Premium orders faster
    const estimatedDate = new Date(orderDate.getTime() + estimatedDays * 24 * 60 * 60 * 1000);
    
    return estimatedDate.toISOString();
  },

  // Check if order can be returned (within 7 days of delivery)
  canReturnOrder: (deliveredAt) => {
    if (!deliveredAt) return false;
    
    const deliveryDate = new Date(deliveredAt);
    const now = new Date();
    const daysSinceDelivery = (now - deliveryDate) / (1000 * 60 * 60 * 24);
    
    return daysSinceDelivery <= 7;
  }
};

module.exports = MobileHelpers;