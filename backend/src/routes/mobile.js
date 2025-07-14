const express = require('express');
const router = express.Router();
const ProductModel = require('../models/productModel');
const CategoryModel = require('../models/categoryModel');
const BannerModel = require('../models/bannerModel');
const { authenticate, optionalAuth } = require('../middlewares/authMiddleware');
const { validateSearchQuery, validateIdParam } = require('../middlewares/validation');

// Mobile response formatter
const mobileResponse = (data, message = 'Success') => ({
  success: true,
  message,
  data,
  timestamp: new Date().toISOString()
});

const mobileError = (message, code = 500) => ({
  success: false,
  message,
  code,
  timestamp: new Date().toISOString()
});

// App configuration for mobile clients
router.get('/config', (req, res) => {
  const config = {
    app: {
      minVersion: '1.0.0',
      currentVersion: '1.0.0',
      forceUpdate: false,
      maintenanceMode: false
    },
    features: {
      wishlist: true,
      reviews: true,
      notifications: true,
      socialLogin: false,
      voiceSearch: false
    },
    support: {
      phone: '+91-1234567890',
      email: 'support@wedmantra.com',
      whatsapp: '+91-1234567890'
    },
    legal: {
      termsUrl: 'https://wedmantra.com/terms',
      privacyUrl: 'https://wedmantra.com/privacy',
      returnPolicyUrl: 'https://wedmantra.com/returns'
    },
    payment: {
      methods: ['razorpay', 'upi', 'cod'],
      codLimit: 5000,
      freeShippingLimit: 500
    }
  };
  
  res.json(mobileResponse(config));
});

// Home screen data - optimized for mobile
router.get('/home', optionalAuth, async (req, res) => {
  try {
    const [banners, categories, featuredProducts] = await Promise.all([
      BannerModel.getActiveBanners(),
      CategoryModel.getAll(),
      ProductModel.getFeatured(8)
    ]);
    
    // Format data for mobile consumption
    const homeData = {
      banners: banners.slice(0, 5).map(banner => ({
        id: banner.id,
        title: banner.title,
        subtitle: banner.subtitle,
        imageUrl: banner.image_url,
        mobileImageUrl: banner.mobile_image_url || banner.image_url,
        actionType: banner.action_type,
        actionValue: banner.action_value,
        buttonText: banner.button_text
      })),
      
      categories: categories.slice(0, 8).map(category => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
        imageUrl: category.image_url,
        productCount: 0 // TODO: Add product count if needed
      })),
      
      featuredProducts: featuredProducts.map(product => ({
        id: product.id,
        name: product.name,
        price: product.price,
        salePrice: product.sale_price,
        imageUrl: product.image_url,
        rating: 4.5, // TODO: Calculate from reviews
        reviewCount: 0, // TODO: Get from reviews
        fabric: product.fabric,
        isWishlisted: false // TODO: Check if user has wishlisted
      })),
      
      quickActions: [
        { title: 'New Arrivals', icon: 'new', action: 'category', value: 'new-arrivals' },
        { title: 'Sale', icon: 'sale', action: 'category', value: 'sale' },
        { title: 'Wedding', icon: 'wedding', action: 'occasion', value: 'wedding' },
        { title: 'Festive', icon: 'festival', action: 'occasion', value: 'festival' }
      ],
      
      offers: {
        title: 'Special Offers',
        subtitle: 'Up to 70% Off',
        bannerText: 'Limited Time Deal'
      }
    };
    
    res.json(mobileResponse(homeData));
  } catch (error) {
    console.error('Home data error:', error);
    res.status(500).json(mobileError('Failed to load home data'));
  }
});

// Product search optimized for mobile
router.get('/search', validateSearchQuery, async (req, res) => {
  try {
    const { 
      q, 
      category_id, 
      min_price, 
      max_price, 
      fabric, 
      occasion, 
      sort = 'newest',
      page = 1, 
      limit = 20 
    } = req.query;
    
    const result = await ProductModel.search({
      q, 
      category_id, 
      min_price, 
      max_price, 
      fabric, 
      occasion, 
      sort,
      page, 
      limit
    });
    
    // Format products for mobile
    const mobileProducts = result.products.map(product => ({
      id: product.id,
      name: product.name,
      price: product.price,
      salePrice: product.sale_price,
      imageUrl: product.image_url,
      fabric: product.fabric,
      occasion: product.occasion,
      region: product.region,
      rating: 4.2, // TODO: Calculate from reviews
      reviewCount: 12, // TODO: Get from reviews
      isWishlisted: false, // TODO: Check if user has wishlisted
      inStock: product.stock_quantity > 0,
      discount: product.sale_price ? 
        Math.round(((product.price - product.sale_price) / product.price) * 100) : 0
    }));
    
    res.json({
      success: true,
      data: mobileProducts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: result.total,
        pages: Math.ceil(result.total / limit),
        hasMore: (page * limit) < result.total
      },
      filters: {
        appliedFilters: { q, category_id, min_price, max_price, fabric, occasion },
        availableFilters: {
          fabrics: ['Cotton', 'Silk', 'Georgette', 'Chiffon', 'Crepe'],
          occasions: ['Wedding', 'Festival', 'Party', 'Casual', 'Office'],
          priceRanges: [
            { min: 0, max: 1000, label: 'Under ₹1,000' },
            { min: 1000, max: 3000, label: '₹1,000 - ₹3,000' },
            { min: 3000, max: 5000, label: '₹3,000 - ₹5,000' },
            { min: 5000, max: 10000, label: '₹5,000 - ₹10,000' },
            { min: 10000, max: null, label: 'Above ₹10,000' }
          ]
        }
      }
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json(mobileError('Search failed'));
  }
});

// Get product details optimized for mobile
router.get('/products/:id', validateIdParam, optionalAuth, async (req, res) => {
  try {
    const product = await ProductModel.getById(req.params.id);
    if (!product) {
      return res.status(404).json(mobileError('Product not found'));
    }
    
    // Get product media and attributes
    const [media, attributes] = await Promise.all([
      ProductModel.getMedia(req.params.id),
      ProductModel.getAttributes(req.params.id)
    ]);
    
    // Format for mobile
    const mobileProduct = {
      id: product.id,
      name: product.name,
      description: product.description,
      shortDescription: product.short_description,
      price: product.price,
      salePrice: product.sale_price,
      sku: product.sku,
      
      // Product details
      fabric: product.fabric,
      workType: product.work_type,
      occasion: product.occasion,
      region: product.region,
      length: product.length,
      blousePiece: product.blouse_piece,
      washCare: product.wash_care,
      
      // Media
      images: media.filter(m => m.media_type === 'image').map(m => ({
        id: m.id,
        url: m.media_url,
        alt: m.alt_text,
        isPrimary: m.is_primary
      })),
      videos: media.filter(m => m.media_type === 'video').map(m => ({
        id: m.id,
        url: m.media_url,
        thumbnail: m.thumbnail_url,
        duration: m.duration
      })),
      
      // Stock and pricing
      inStock: product.stock_quantity > 0,
      stockQuantity: product.stock_quantity,
      discount: product.sale_price ? 
        Math.round(((product.price - product.sale_price) / product.price) * 100) : 0,
      
      // Social proof
      rating: 4.3, // TODO: Calculate from reviews
      reviewCount: 25, // TODO: Get from reviews
      
      // User context
      isWishlisted: false, // TODO: Check if user has wishlisted
      inCart: false, // TODO: Check if user has in cart
      
      // Additional attributes
      customAttributes: attributes.reduce((acc, attr) => {
        acc[attr.attribute_name] = attr.attribute_value;
        return acc;
      }, {}),
      
      // Related info
      category: {
        id: product.category_id,
        name: product.category_name // TODO: Join with category
      },
      brand: {
        id: product.brand_id,
        name: product.brand_name // TODO: Join with brand
      },
      
      // Shipping info
      shipping: {
        freeShipping: product.price >= 500,
        estimatedDays: '3-5 days',
        returnPolicy: '7 days return'
      }
    };
    
    res.json(mobileResponse(mobileProduct));
  } catch (error) {
    console.error('Product details error:', error);
    res.status(500).json(mobileError('Failed to load product details'));
  }
});

// Get products by category
router.get('/categories/:id/products', validateIdParam, async (req, res) => {
  try {
    const { page = 1, limit = 20, sort = 'newest' } = req.query;
    const products = await ProductModel.getByCategory(req.params.id, { 
      page, 
      limit, 
      sort 
    });
    
    const mobileProducts = products.map(product => ({
      id: product.id,
      name: product.name,
      price: product.price,
      salePrice: product.sale_price,
      imageUrl: product.image_url,
      fabric: product.fabric,
      rating: 4.2,
      reviewCount: 8,
      isWishlisted: false,
      discount: product.sale_price ? 
        Math.round(((product.price - product.sale_price) / product.price) * 100) : 0
    }));
    
    res.json({
      success: true,
      data: mobileProducts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        hasMore: products.length === parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Category products error:', error);
    res.status(500).json(mobileError('Failed to load category products'));
  }
});

// Get all categories for mobile
router.get('/categories', async (req, res) => {
  try {
    const categories = await CategoryModel.getAll();
    
    const mobileCategories = categories.map(category => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      imageUrl: category.image_url,
      productCount: 0, // TODO: Add if needed
      subcategories: [] // TODO: Add if needed
    }));
    
    res.json(mobileResponse(mobileCategories));
  } catch (error) {
    console.error('Categories error:', error);
    res.status(500).json(mobileError('Failed to load categories'));
  }
});

// App version check
router.get('/version-check', (req, res) => {
  const { version, platform } = req.query;
  
  const minVersions = {
    ios: '1.0.0',
    android: '1.0.0'
  };
  
  const currentVersions = {
    ios: '1.0.0',
    android: '1.0.0'
  };
  
  const response = {
    currentVersion: currentVersions[platform] || '1.0.0',
    minSupportedVersion: minVersions[platform] || '1.0.0',
    forceUpdate: false, // Set to true when you need to force update
    recommendUpdate: false,
    updateMessage: 'A new version is available with bug fixes and improvements.',
    downloadUrl: platform === 'ios' 
      ? 'https://apps.apple.com/app/wedmantra' 
      : 'https://play.google.com/store/apps/details?id=com.wedmantra.app'
  };
  
  res.json(mobileResponse(response));
});

// Quick actions for home screen
router.get('/quick-actions', async (req, res) => {
  try {
    const actions = [
      {
        id: 'new_arrivals',
        title: 'New Arrivals',
        subtitle: 'Latest collections',
        icon: 'sparkles',
        color: '#FF6B35',
        action: 'navigate',
        route: 'ProductList',
        params: { filter: 'new' }
      },
      {
        id: 'sale',
        title: 'Sale',
        subtitle: 'Up to 70% off',
        icon: 'tag',
        color: '#E74C3C',
        action: 'navigate',
        route: 'ProductList',
        params: { filter: 'sale' }
      },
      {
        id: 'wedding',
        title: 'Wedding Collection',
        subtitle: 'Bridal sarees',
        icon: 'heart',
        color: '#9B59B6',
        action: 'navigate',
        route: 'ProductList',
        params: { occasion: 'wedding' }
      },
      {
        id: 'festive',
        title: 'Festive Wear',
        subtitle: 'Festival specials',
        icon: 'star',
        color: '#F39C12',
        action: 'navigate',
        route: 'ProductList',
        params: { occasion: 'festival' }
      }
    ];
    
    res.json(mobileResponse(actions));
  } catch (error) {
    res.status(500).json(mobileError('Failed to load quick actions'));
  }
});

// Recently viewed products (requires auth)
router.get('/recent', authenticate, async (req, res) => {
  try {
    // TODO: Implement recently viewed tracking
    const recentProducts = [];
    res.json(mobileResponse(recentProducts));
  } catch (error) {
    res.status(500).json(mobileError('Failed to load recent products'));
  }
});

// Trending/popular products
router.get('/trending', async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : 10;
    // TODO: Implement trending logic based on views/orders
    const trending = await ProductModel.getFeatured(limit);
    
    const mobileTrending = trending.map(product => ({
      id: product.id,
      name: product.name,
      price: product.price,
      salePrice: product.sale_price,
      imageUrl: product.image_url,
      fabric: product.fabric,
      trendingRank: Math.floor(Math.random() * 100) + 1
    }));
    
    res.json(mobileResponse(mobileTrending));
  } catch (error) {
    res.status(500).json(mobileError('Failed to load trending products'));
  }
});

module.exports = router;