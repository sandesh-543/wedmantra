const express = require('express');
const router = express.Router();

// Models
const ProductModel = require('../models/productModel');
const CategoryModel = require('../models/categoryModel');
const BannerModel = require('../models/bannerModel');
const CartModel = require('../models/cartModel');

// Services
const MobileProductService = require('../services/mobileProductService');
const UserContextService = require('../services/userContextService');
const RecentlyViewedService = require('../services/recentlyViewedService');
const WishlistService = require('../services/wishlistService');

// Utilities
const MobileHelpers = require('../utils/mobileHelpers');
const { authenticate, optionalAuth } = require('../middlewares/authMiddleware');
const { validateSearchQuery, validateIdParam } = require('../middlewares/validation');

// ===================================
// MOBILE CONFIGURATION
// ===================================

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
  
  res.json(MobileHelpers.mobileResponse(config));
});

// ===================================
// HOME SCREEN API
// ===================================

router.get('/home', optionalAuth, async (req, res) => {
  try {
    const [banners, categories, featuredProducts] = await Promise.all([
      BannerModel.getActiveBanners(),
      CategoryModel.getAll(),
      ProductModel.getFeatured(8)
    ]);
    
    // Get enhanced data for mobile
    const [categoriesWithCount, featuredWithRatings] = await Promise.all([
      Promise.all(
        categories.slice(0, 8).map(async (category) => {
          const productCount = await MobileProductService.getCategoryProductCount(category.id);
          return MobileHelpers.formatCategoryForMobile(category, productCount);
        })
      ),
      MobileProductService.getProductsWithMobileData(featuredProducts, req.user?.id)
    ]);
    
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
      
      categories: categoriesWithCount,
      featuredProducts: featuredWithRatings,
      
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
    
    res.json(MobileHelpers.mobileResponse(homeData));
  } catch (error) {
    res.status(500).json(MobileHelpers.formatApiError(error, req));
  }
});

// ===================================
// PRODUCT APIS
// ===================================

// Ultra-fast product list for mobile
router.get('/products/quick', async (req, res) => {
  try {
    const validation = MobileHelpers.validateMobileParams(req, {
      page: { type: 'number', min: 1, max: 1000 },
      limit: { type: 'number', min: 1, max: 20 },
      category_id: { type: 'number', min: 1 }
    });
    
    if (!validation.isValid) {
      return res.status(400).json(MobileHelpers.mobileError('Invalid parameters', 400, validation.errors));
    }
    
    const { page = 1, limit = 10, category_id, search } = req.query;
    
    const filters = {
      page: parseInt(page),
      limit: Math.min(parseInt(limit), 20),
      category_id,
      search,
      sort: 'created_at',
      order: 'DESC'
    };
    
    const result = await ProductModel.getAll(filters);
    const mobileProducts = await MobileProductService.getProductsWithMobileData(result.products, req.user?.id);
    
    res.json({
      success: true,
      data: mobileProducts,
      pagination: result.pagination,
      meta: {
        timestamp: new Date().toISOString(),
        cached: false
      }
    });
  } catch (error) {
    res.status(500).json(MobileHelpers.formatApiError(error, req));
  }
});

// Enhanced product details for mobile
router.get('/products/:id/mobile', validateIdParam, optionalAuth, async (req, res) => {
  try {
    const product = await ProductModel.getById(req.params.id);
    if (!product) {
      return res.status(404).json(MobileHelpers.mobileError('Product not found'));
    }
    
    // Track view if user is authenticated
    if (req.user) {
      await RecentlyViewedService.track(req.user.id, req.params.id);
    }
    
    // Get all required data
    const [media, relatedProducts, rating, userContext] = await Promise.all([
      ProductModel.getMedia(req.params.id),
      ProductModel.getByCategory(product.category_id, { limit: 4 }),
      MobileProductService.getProductRating(req.params.id),
      req.user ? UserContextService.getProductUserContext(req.user.id, req.params.id) : {}
    ]);
    
    // Format related products
    const relatedWithRatings = await MobileProductService.getProductsWithMobileData(
      relatedProducts.slice(0, 4), 
      req.user?.id
    );
    
    // Create mobile-optimized product details
    const mobileProduct = MobileHelpers.formatProductForDetail(product, userContext, {
      images: media.filter(m => m.media_type === 'image').map(m => ({
        id: m.id,
        url: m.media_url,
        thumbnail: m.media_url,
        alt: m.alt_text,
        isPrimary: m.is_primary
      })),
      rating: rating.rating,
      reviewCount: rating.reviewCount,
      relatedProducts: relatedWithRatings
    });
    
    res.json(MobileHelpers.mobileResponse(mobileProduct));
  } catch (error) {
    res.status(500).json(MobileHelpers.formatApiError(error, req));
  }
});

// Quick search for mobile
router.get('/search/quick', async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;
    
    if (!q || q.length < 2) {
      return res.json({
        success: true,
        data: [],
        suggestions: ['Silk Sarees', 'Cotton Sarees', 'Wedding Collection', 'Casual Wear']
      });
    }
    
    const result = await ProductModel.search({
      q: MobileHelpers.sanitizeMobileInput(q, 'string'),
      limit: Math.min(parseInt(limit), 20),
      page: 1
    });
    
    const quickResults = result.products.map(product => 
      MobileHelpers.formatProductForList(product)
    );
    
    res.json({
      success: true,
      data: quickResults,
      total: result.total,
      query: q
    });
  } catch (error) {
    res.status(500).json(MobileHelpers.formatApiError(error, req));
  }
});

// Popular/trending products
router.get('/products/popular', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 8, 20);
    const trending = await MobileProductService.getTrendingProducts(limit);
    const popularProducts = await MobileProductService.getProductsWithMobileData(trending, req.user?.id);
    
    res.json(MobileHelpers.mobileResponse(popularProducts));
  } catch (error) {
    res.status(500).json(MobileHelpers.formatApiError(error, req));
  }
});

// ===================================
// CATEGORY APIS
// ===================================

router.get('/categories/quick', async (req, res) => {
  try {
    const categories = await CategoryModel.getAll();
    
    const mobileCategories = await Promise.all(
      categories.slice(0, 8).map(async (cat) => {
        const productCount = await MobileProductService.getCategoryProductCount(cat.id);
        return MobileHelpers.formatCategoryForMobile(cat, productCount);
      })
    );
    
    res.json({
      success: true,
      data: mobileCategories,
      meta: {
        total: categories.length,
        showing: mobileCategories.length
      }
    });
  } catch (error) {
    res.status(500).json(MobileHelpers.formatApiError(error, req));
  }
});

// ===================================
// CART APIS
// ===================================

router.get('/cart/quick', authenticate, async (req, res) => {
  try {
    const cartItems = await CartModel.getCartByUser(req.user.id);
    const cartSummary = MobileHelpers.formatCartSummary(cartItems);
    
    const optimizedItems = await Promise.all(
      cartItems.map(async (item) => {
        const product = await ProductModel.getById(item.product_id);
        const maxQuantity = product ? Math.min(product.stock_quantity, 10) : 0;
        
        return {
          id: item.id,
          productId: item.product_id,
          name: item.name,
          price: item.price,
          salePrice: item.sale_price,
          quantity: item.quantity,
          image: item.image_url,
          total: (item.sale_price || item.price) * item.quantity,
          sku: item.sku,
          maxQuantity,
          inStock: product ? product.stock_quantity > 0 : false
        };
      })
    );
    
    res.json({
      success: true,
      data: {
        items: optimizedItems,
        summary: cartSummary,
        meta: {
          currency: 'INR',
          lastUpdated: new Date().toISOString()
        }
      }
    });
  } catch (error) {
    res.status(500).json(MobileHelpers.formatApiError(error, req));
  }
});

router.post('/cart/update', authenticate, async (req, res) => {
  try {
    const validation = MobileHelpers.validateMobileParams(req, {
      productId: { type: 'number', required: true, min: 1 },
      quantity: { type: 'number', min: 0, max: 99 },
      action: { type: 'string', enum: ['add', 'update', 'remove'] }
    });
    
    if (!validation.isValid) {
      return res.status(400).json(MobileHelpers.mobileError('Invalid parameters', 400, validation.errors));
    }
    
    const { productId, quantity, action = 'add' } = req.body;
    const userId = req.user.id;
    
    const product = await ProductModel.getById(productId);
    if (!product) {
      return res.status(404).json(MobileHelpers.mobileError('Product not found'));
    }
    
    if (action !== 'remove' && quantity > product.stock_quantity) {
      return res.status(400).json(MobileHelpers.mobileError('Insufficient stock', 400, {
        available: product.stock_quantity,
        requested: quantity
      }));
    }
    
    // Perform cart operation
    let result;
    let message;
    
    switch (action) {
      case 'add':
        result = await CartModel.addItem(userId, productId, quantity);
        message = 'Item added to cart';
        break;
        
      case 'update':
        const cartItems = await CartModel.getCartByUser(userId);
        const cartItem = cartItems.find(item => item.product_id === productId);
        if (!cartItem) {
          return res.status(404).json(MobileHelpers.mobileError('Item not found in cart'));
        }
        if (quantity === 0) {
          await CartModel.removeItem(cartItem.id);
          message = 'Item removed from cart';
        } else {
          result = await CartModel.updateItem(cartItem.id, quantity);
          message = 'Cart updated';
        }
        break;
        
      case 'remove':
        const items = await CartModel.getCartByUser(userId);
        const itemToRemove = items.find(item => item.product_id === productId);
        if (itemToRemove) {
          await CartModel.removeItem(itemToRemove.id);
        }
        message = 'Item removed from cart';
        break;
    }
    
    // Get updated cart summary
    const updatedCart = await CartModel.getCartByUser(userId);
    const summary = MobileHelpers.formatCartSummary(updatedCart);
    
    res.json({
      success: true,
      message,
      data: {
        ...summary,
        product: MobileHelpers.formatProductForList(product),
        action,
        quantity: quantity || 0
      }
    });
  } catch (error) {
    res.status(500).json(MobileHelpers.formatApiError(error, req));
  }
});

router.get('/cart/count', authenticate, async (req, res) => {
  try {
    const cartItems = await CartModel.getCartByUser(req.user.id);
    const count = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    
    res.json({
      success: true,
      data: { 
        count,
        itemCount: cartItems.length
      }
    });
  } catch (error) {
    res.status(500).json(MobileHelpers.formatApiError(error, req));
  }
});

// ===================================
// WISHLIST APIS
// ===================================

router.get('/wishlist', authenticate, async (req, res) => {
  try {
    const wishlistItems = await WishlistService.getByUser(req.user.id);
    
    const mobileWishlist = await Promise.all(
      wishlistItems.map(async (item) => {
        const rating = await MobileProductService.getProductRating(item.product_id);
        return {
          ...MobileHelpers.formatProductForList(item),
          rating: rating.rating,
          reviewCount: rating.reviewCount,
          addedAt: item.created_at
        };
      })
    );
    
    res.json({
      success: true,
      data: mobileWishlist,
      count: mobileWishlist.length
    });
  } catch (error) {
    res.status(500).json(MobileHelpers.formatApiError(error, req));
  }
});

router.post('/wishlist/add', authenticate, async (req, res) => {
  try {
    const { productId } = req.body;
    
    if (!productId) {
      return res.status(400).json(MobileHelpers.mobileError('Product ID is required'));
    }
    
    const product = await ProductModel.getById(productId);
    if (!product) {
      return res.status(404).json(MobileHelpers.mobileError('Product not found'));
    }
    
    await WishlistService.addItem(req.user.id, productId);
    
    res.json({
      success: true,
      message: 'Item added to wishlist',
      data: {
        productId,
        productName: product.name,
        productImage: product.image_url
      }
    });
  } catch (error) {
    res.status(500).json(MobileHelpers.formatApiError(error, req));
  }
});

router.delete('/wishlist/remove/:productId', authenticate, validateIdParam, async (req, res) => {
  try {
    const { productId } = req.params;
    await WishlistService.removeItem(req.user.id, productId);
    
    res.json({
      success: true,
      message: 'Item removed from wishlist',
      data: { productId: parseInt(productId) }
    });
  } catch (error) {
    res.status(500).json(MobileHelpers.formatApiError(error, req));
  }
});

// ===================================
// USER SPECIFIC APIS
// ===================================

router.get('/recent', authenticate, async (req, res) => {
  try {
    const recentProducts = await RecentlyViewedService.getRecentlyViewed(req.user.id, 10);
    const mobileRecent = await MobileProductService.getProductsWithMobileData(recentProducts, req.user.id);
    
    res.json(MobileHelpers.mobileResponse(mobileRecent));
  } catch (error) {
    res.status(500).json(MobileHelpers.formatApiError(error, req));
  }
});

// ===================================
// UTILITY APIS
// ===================================

router.get('/version-check', (req, res) => {
  const { version, platform } = req.query;
  
  const response = {
    currentVersion: '1.0.0',
    minSupportedVersion: '1.0.0',
    forceUpdate: false,
    recommendUpdate: false,
    updateMessage: 'A new version is available with bug fixes and improvements.',
    downloadUrl: platform === 'ios' 
      ? 'https://apps.apple.com/app/wedmantra' 
      : 'https://play.google.com/store/apps/details?id=com.wedmantra.app'
  };
  
  res.json(MobileHelpers.mobileResponse(response));
});

router.get('/search/filters', (req, res) => {
  const filters = MobileHelpers.formatSearchFilters();
  res.json(MobileHelpers.mobileResponse(filters));
});

module.exports = router;