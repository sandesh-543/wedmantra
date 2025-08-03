const db = require('../config/db');
const ProductModel = require('../models/productModel');
const { CacheService, CACHE_TTL } = require('./cacheService');

const MobileProductService = {
  // Get category product count with caching
  async getCategoryProductCount(categoryId) {
    const cacheKey = `category:${categoryId}:count`;
    
    return await CacheService.cacheWrapper(cacheKey, async () => {
      try {
        const result = await db.query(
          'SELECT COUNT(*) FROM products WHERE category_id = $1 AND status = $2 AND deleted_at IS NULL',
          [categoryId, 'active']
        );
        return parseInt(result.rows[0].count, 10);
      } catch (error) {
        console.error('Error getting category product count:', error);
        return 0;
      }
    }, CACHE_TTL.CATEGORIES);
  },

  // Calculate real ratings from reviews with caching
  async getProductRating(productId) {
    const cacheKey = `product:${productId}:rating`;
    
    return await CacheService.cacheWrapper(cacheKey, async () => {
      try {
        const result = await db.query(
          `SELECT 
            AVG(rating)::DECIMAL(3,2) as average_rating,
            COUNT(*) as review_count
           FROM product_reviews 
           WHERE product_id = $1 AND is_approved = true`,
          [productId]
        );
        
        const row = result.rows[0];
        return {
          rating: row.average_rating ? parseFloat(row.average_rating) : 4.2,
          reviewCount: parseInt(row.review_count, 10)
        };
      } catch (error) {
        console.error('Error getting product rating:', error);
        return { rating: 4.2, reviewCount: 0 };
      }
    }, CACHE_TTL.PRODUCTS);
  },

  // Get trending products based on views/orders with caching
  async getTrendingProducts(limit = 10) {
    const cacheKey = `products:trending:${limit}`;
    
    return await CacheService.cacheWrapper(cacheKey, async () => {
      try {
        const result = await db.query(
          `SELECT 
            p.*,
            COALESCE(view_count, 0) as view_count,
            COALESCE(order_count, 0) as order_count,
            (COALESCE(view_count, 0) * 0.3 + COALESCE(order_count, 0) * 0.7) as trend_score
           FROM products p
           LEFT JOIN (
             SELECT product_id, COUNT(*) as view_count
             FROM product_views 
             WHERE created_at >= NOW() - INTERVAL '7 days'
             GROUP BY product_id
           ) views ON p.id = views.product_id
           LEFT JOIN (
             SELECT oi.product_id, COUNT(*) as order_count
             FROM order_items oi
             JOIN orders o ON oi.order_id = o.id
             WHERE o.created_at >= NOW() - INTERVAL '7 days'
             GROUP BY oi.product_id
           ) orders ON p.id = orders.product_id
           WHERE p.status = 'active' AND p.deleted_at IS NULL
           ORDER BY trend_score DESC, p.created_at DESC
           LIMIT $1`,
          [limit]
        );
        
        return result.rows;
      } catch (error) {
        console.error('Error getting trending products:', error);
        // Fallback to featured products
        return await ProductModel.getFeatured(limit);
      }
    }, 30 * 60); // Cache for 30 minutes
  },

  // Get products with enhanced mobile data
  async getProductsWithMobileData(products, userId = null) {
    return await Promise.all(
        products.map(async (product) => {
        // Destructure directly to easily access the new boolean flags
        const {
            id,
            name,
            price,
            sale_price,
            image_url, 
            fabric,
            stock_quantity,
            featured,
            is_new_arrival, 
            is_best_seller, 
            is_pre_order,   
            is_coming_soon, 
            is_limited_edition, 
            region, 
            work_type 
        } = product;

        // Fetch rating and wishlist status concurrently
        const [rating, isWishlisted] = await Promise.all([
            this.getProductRating(id), // Use destructured 'id'
            userId ? require('./userContextService').isProductWishlisted(userId, id) : false // Use destructured 'id'
        ]);

        // Determine badge based on product properties
        let badge = null;

        if (stock_quantity <= 0) {
            badge = 'Out of Stock';
        } else if (is_pre_order) {
            badge = 'Pre-Order';
        } else if (is_coming_soon) {
            badge = 'Coming Soon';
        } else if (sale_price && sale_price < price) {
            // Calculate discount percentage for a more informative "Sale" badge
            const discountPercentage = Math.round(((price - sale_price) / price) * 100);
            badge = `Sale -${discountPercentage}%`;
        }

        else if (is_new_arrival) {
            badge = 'New Arrival';
        } else if (featured) {
            badge = 'Featured';
        } else if (is_best_seller) { 
            badge = 'Best Seller';
        } else if (is_limited_edition) {
            badge = 'Limited Edition';
        } 

        return {
          id: product.id,
          name: product.name,
          price: product.price,
          salePrice: product.sale_price,
          image: product.image_url,
          fabric: product.fabric,
          rating: rating.rating,
          reviewCount: rating.reviewCount,
          inStock: product.stock_quantity > 0,
          isWishlisted,
          discount: product.sale_price ? 
            Math.round(((product.price - product.sale_price) / product.price) * 100) : 0,
          badge
        };
      })
    );
  },

  // Get popular products for home screen
  async getPopularProducts(limit = 8) {
    const cacheKey = `products:popular:${limit}`;
    
    return await CacheService.cacheWrapper(cacheKey, async () => {
      try {
        // Get products with high order count in last 30 days
        const result = await db.query(
          `SELECT 
            p.*,
            COALESCE(order_count, 0) as order_count,
            pm.media_url as image_url
           FROM products p
           LEFT JOIN (
             SELECT oi.product_id, COUNT(*) as order_count
             FROM order_items oi
             JOIN orders o ON oi.order_id = o.id
             WHERE o.created_at >= NOW() - INTERVAL '30 days'
               AND o.status IN ('delivered', 'shipped')
             GROUP BY oi.product_id
           ) orders ON p.id = orders.product_id
           LEFT JOIN product_media pm ON p.id = pm.product_id AND pm.is_primary = true
           WHERE p.status = 'active' AND p.deleted_at IS NULL
           ORDER BY order_count DESC, p.featured DESC, p.created_at DESC
           LIMIT $1`,
          [limit]
        );
        
        return result.rows;
      } catch (error) {
        console.error('Error getting popular products:', error);
        return await ProductModel.getFeatured(limit);
      }
    }, CACHE_TTL.PRODUCTS);
  },

  // Batch get ratings for multiple products (performance optimization)
  async batchGetProductRatings(productIds) {
    if (!productIds || productIds.length === 0) return {};
    
    try {
      const placeholders = productIds.map((_, i) => `$${i + 1}`).join(',');
      const result = await db.query(
        `SELECT 
          product_id,
          AVG(rating)::DECIMAL(3,2) as average_rating,
          COUNT(*) as review_count
         FROM product_reviews 
         WHERE product_id IN (${placeholders}) AND is_approved = true
         GROUP BY product_id`,
        productIds
      );
      
      // Convert to object for easy lookup
      const ratings = {};
      result.rows.forEach(row => {
        ratings[row.product_id] = {
          rating: row.average_rating ? parseFloat(row.average_rating) : 4.2,
          reviewCount: parseInt(row.review_count, 10)
        };
      });
      
      // Fill in missing ratings with defaults
      productIds.forEach(id => {
        if (!ratings[id]) {
          ratings[id] = { rating: 4.2, reviewCount: 0 };
        }
      });
      
      return ratings;
    } catch (error) {
      console.error('Error batch getting product ratings:', error);
      // Return default ratings for all products
      const defaultRatings = {};
      productIds.forEach(id => {
        defaultRatings[id] = { rating: 4.2, reviewCount: 0 };
      });
      return defaultRatings;
    }
  }
};

module.exports = MobileProductService;