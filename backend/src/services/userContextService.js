const db = require('../config/db');
const { CacheService, CACHE_TTL } = require('./cacheService');

const UserContextService = {
  // Check if user has wishlisted a product
  async isProductWishlisted(userId, productId) {
    if (!userId) return false;
    
    try {
      const result = await db.query(
        'SELECT id FROM wishlist_items WHERE user_id = $1 AND product_id = $2',
        [userId, productId]
      );
      return result.rows.length > 0;
    } catch (error) {
      console.error('Error checking wishlist:', error);
      return false;
    }
  },

  // Check if user has product in cart
  async isProductInCart(userId, productId) {
    if (!userId) return false;
    
    try {
      const result = await db.query(
        'SELECT id FROM cart_items WHERE user_id = $1 AND product_id = $2',
        [userId, productId]
      );
      return result.rows.length > 0;
    } catch (error) {
      console.error('Error checking cart:', error);
      return false;
    }
  },

  // Check if user can review a product (has purchased and not reviewed)
  async canUserReview(userId, productId) {
    if (!userId) return false;
    
    try {
      // Check if user has purchased this product
      const purchaseCheck = await db.query(
        `SELECT DISTINCT o.id 
         FROM orders o
         JOIN order_items oi ON o.id = oi.order_id
         WHERE o.user_id = $1 AND oi.product_id = $2 AND o.status = 'delivered'`,
        [userId, productId]
      );
      
      if (purchaseCheck.rows.length === 0) return false;
      
      // Check if user already reviewed this product
      const reviewCheck = await db.query(
        'SELECT id FROM product_reviews WHERE user_id = $1 AND product_id = $2',
        [userId, productId]
      );
      
      return reviewCheck.rows.length === 0;
    } catch (error) {
      console.error('Error checking review eligibility:', error);
      return false;
    }
  },

  // Get complete user context for a product
  async getProductUserContext(userId, productId) {
    if (!userId) {
      return {
        isWishlisted: false,
        isInCart: false,
        canReview: false,
        cartQuantity: 0
      };
    }

    try {
      const [wishlistCheck, cartCheck, reviewEligibility] = await Promise.all([
        this.isProductWishlisted(userId, productId),
        this.getCartItemQuantity(userId, productId),
        this.canUserReview(userId, productId)
      ]);

      return {
        isWishlisted: wishlistCheck,
        isInCart: cartCheck.inCart,
        canReview: reviewEligibility,
        cartQuantity: cartCheck.quantity
      };
    } catch (error) {
      console.error('Error getting product user context:', error);
      return {
        isWishlisted: false,
        isInCart: false,
        canReview: false,
        cartQuantity: 0
      };
    }
  },

  // Get cart item quantity for a product
  async getCartItemQuantity(userId, productId) {
    if (!userId) return { inCart: false, quantity: 0 };
    
    try {
      const result = await db.query(
        'SELECT quantity FROM cart_items WHERE user_id = $1 AND product_id = $2',
        [userId, productId]
      );
      
      if (result.rows.length === 0) {
        return { inCart: false, quantity: 0 };
      }
      
      return { 
        inCart: true, 
        quantity: result.rows[0].quantity 
      };
    } catch (error) {
      console.error('Error checking cart quantity:', error);
      return { inCart: false, quantity: 0 };
    }
  },

  // Batch check user context for multiple products (performance optimization)
  async batchGetUserContext(userId, productIds) {
    if (!userId || !productIds || productIds.length === 0) {
      const emptyContext = {};
      productIds?.forEach(id => {
        emptyContext[id] = {
          isWishlisted: false,
          isInCart: false,
          canReview: false,
          cartQuantity: 0
        };
      });
      return emptyContext;
    }

    try {
      const placeholders = productIds.map((_, i) => `$${i + 2}`).join(',');
      
      const [wishlistResults, cartResults, reviewResults] = await Promise.all([
        // Get wishlist items
        db.query(
          `SELECT product_id FROM wishlist_items WHERE user_id = $1 AND product_id IN (${placeholders})`,
          [userId, ...productIds]
        ),
        
        // Get cart items
        db.query(
          `SELECT product_id, quantity FROM cart_items WHERE user_id = $1 AND product_id IN (${placeholders})`,
          [userId, ...productIds]
        ),
        
        // Get products user can review (purchased but not reviewed)
        db.query(
          `SELECT DISTINCT oi.product_id
           FROM order_items oi
           JOIN orders o ON oi.order_id = o.id
           WHERE o.user_id = $1 AND oi.product_id IN (${placeholders}) 
             AND o.status = 'delivered'
             AND NOT EXISTS (
               SELECT 1 FROM product_reviews pr 
               WHERE pr.user_id = $1 AND pr.product_id = oi.product_id
             )`,
          [userId, ...productIds]
        )
      ]);

      // Process results into context object
      const context = {};
      const wishlistedIds = new Set(wishlistResults.rows.map(r => r.product_id));
      const cartItems = new Map(cartResults.rows.map(r => [r.product_id, r.quantity]));
      const reviewableIds = new Set(reviewResults.rows.map(r => r.product_id));

      productIds.forEach(productId => {
        context[productId] = {
          isWishlisted: wishlistedIds.has(productId),
          isInCart: cartItems.has(productId),
          canReview: reviewableIds.has(productId),
          cartQuantity: cartItems.get(productId) || 0
        };
      });

      return context;
    } catch (error) {
      console.error('Error batch getting user context:', error);
      // Return empty context for all products
      const emptyContext = {};
      productIds.forEach(id => {
        emptyContext[id] = {
          isWishlisted: false,
          isInCart: false,
          canReview: false,
          cartQuantity: 0
        };
      });
      return emptyContext;
    }
  },

  // Get user's purchase history for a product
  async getUserProductPurchases(userId, productId) {
    if (!userId) return [];
    
    try {
      const result = await db.query(
        `SELECT o.id, o.order_number, o.status, o.created_at, oi.quantity, oi.unit_price
         FROM orders o
         JOIN order_items oi ON o.id = oi.order_id
         WHERE o.user_id = $1 AND oi.product_id = $2
         ORDER BY o.created_at DESC`,
        [userId, productId]
      );
      
      return result.rows;
    } catch (error) {
      console.error('Error getting user product purchases:', error);
      return [];
    }
  }
};

module.exports = UserContextService;