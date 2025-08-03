const db = require('../config/db');
const { CacheService, CACHE_TTL } = require('./cacheService');

const RecentlyViewedService = {
  // Track a product view for a user
  async track(userId, productId) {
    if (!userId || !productId) return;
    
    try {
      // Remove existing view to update timestamp (upsert pattern)
      await db.query(
        'DELETE FROM product_views WHERE user_id = $1 AND product_id = $2',
        [userId, productId]
      );
      
      // Add new view with current timestamp
      await db.query(
        'INSERT INTO product_views (user_id, product_id, created_at) VALUES ($1, $2, NOW())',
        [userId, productId]
      );
      
      // Keep only last 50 views per user (async cleanup)
      this.cleanupOldViews(userId).catch(err => {
        console.error('Error cleaning up old views:', err);
      });
      
      // Invalidate cache
      await CacheService.del(`recent:${userId}`);
      
    } catch (error) {
      console.error('Error tracking product view:', error);
    }
  },

  // Get recently viewed products for a user
  async getRecentlyViewed(userId, limit = 10) {
    if (!userId) return [];
    
    const cacheKey = `recent:${userId}:${limit}`;
    
    return await CacheService.cacheWrapper(cacheKey, async () => {
      try {
        const result = await db.query(
          `SELECT DISTINCT p.*, pv.created_at as viewed_at,
                  pm.media_url as image_url
           FROM product_views pv
           JOIN products p ON pv.product_id = p.id
           LEFT JOIN product_media pm ON p.id = pm.product_id AND pm.is_primary = true
           WHERE pv.user_id = $1 AND p.status = 'active' AND p.deleted_at IS NULL
           ORDER BY pv.created_at DESC
           LIMIT $2`,
          [userId, limit]
        );
        
        return result.rows;
      } catch (error) {
        console.error('Error getting recently viewed:', error);
        return [];
      }
    }, CACHE_TTL.USER);
  },

  // Clean up old views for a user (keep only last 50)
  async cleanupOldViews(userId) {
    try {
      await db.query(
        `DELETE FROM product_views 
         WHERE user_id = $1 AND id NOT IN (
           SELECT id FROM product_views 
           WHERE user_id = $1 
           ORDER BY created_at DESC 
           LIMIT 50
         )`,
        [userId]
      );
    } catch (error) {
      console.error('Error cleaning up old views:', error);
    }
  },

  // Get view count for a product (for analytics)
  async getProductViewCount(productId, days = 7) {
    try {
      const result = await db.query(
        `SELECT COUNT(*) as view_count
         FROM product_views 
         WHERE product_id = $1 AND created_at >= NOW() - INTERVAL '${days} days'`,
        [productId]
      );
      
      return parseInt(result.rows[0].view_count, 10);
    } catch (error) {
      console.error('Error getting product view count:', error);
      return 0;
    }
  },

  // Get most viewed products (for trending/popular)
  async getMostViewedProducts(limit = 10, days = 7) {
    const cacheKey = `most_viewed:${limit}:${days}`;
    
    return await CacheService.cacheWrapper(cacheKey, async () => {
      try {
        const result = await db.query(
          `SELECT p.*, COUNT(pv.id) as view_count,
                  pm.media_url as image_url
           FROM products p
           LEFT JOIN product_views pv ON p.id = pv.product_id 
             AND pv.created_at >= NOW() - INTERVAL '${days} days'
           LEFT JOIN product_media pm ON p.id = pm.product_id AND pm.is_primary = true
           WHERE p.status = 'active' AND p.deleted_at IS NULL
           GROUP BY p.id, pm.media_url
           HAVING COUNT(pv.id) > 0
           ORDER BY view_count DESC
           LIMIT $1`,
          [limit]
        );
        
        return result.rows;
      } catch (error) {
        console.error('Error getting most viewed products:', error);
        return [];
      }
    }, 30 * 60); // Cache for 30 minutes
  },

  // Get view analytics for admin dashboard
  async getViewAnalytics(days = 30) {
    try {
      const [totalViews, uniqueViewers, topProducts] = await Promise.all([
        // Total views
        db.query(
          `SELECT COUNT(*) as total_views
           FROM product_views 
           WHERE created_at >= NOW() - INTERVAL '${days} days'`
        ),
        
        // Unique viewers
        db.query(
          `SELECT COUNT(DISTINCT user_id) as unique_viewers
           FROM product_views 
           WHERE created_at >= NOW() - INTERVAL '${days} days'`
        ),
        
        // Top 5 viewed products
        db.query(
          `SELECT p.name, COUNT(pv.id) as view_count
           FROM products p
           JOIN product_views pv ON p.id = pv.product_id
           WHERE pv.created_at >= NOW() - INTERVAL '${days} days'
           GROUP BY p.id, p.name
           ORDER BY view_count DESC
           LIMIT 5`
        )
      ]);

      return {
        totalViews: parseInt(totalViews.rows[0].total_views, 10),
        uniqueViewers: parseInt(uniqueViewers.rows[0].unique_viewers, 10),
        topProducts: topProducts.rows
      };
    } catch (error) {
      console.error('Error getting view analytics:', error);
      return {
        totalViews: 0,
        uniqueViewers: 0,
        topProducts: []
      };
    }
  },

  // Clear all views for a user (GDPR compliance)
  async clearUserViews(userId) {
    try {
      await db.query(
        'DELETE FROM product_views WHERE user_id = $1',
        [userId]
      );
      
      // Clear cache
      await CacheService.del(`recent:${userId}*`);
      
      return true;
    } catch (error) {
      console.error('Error clearing user views:', error);
      return false;
    }
  },

  // Batch track views (for performance)
  async batchTrack(viewData) {
    if (!viewData || viewData.length === 0) return;
    
    try {
      // Build bulk insert query
      const values = viewData.map((item, index) => 
        `($${index * 2 + 1}, $${index * 2 + 2}, NOW())`
      ).join(', ');
      
      const params = viewData.flatMap(item => [item.userId, item.productId]);
      
      await db.query(
        `INSERT INTO product_views (user_id, product_id, created_at) 
         VALUES ${values}`,
        params
      );
      
      // Invalidate caches for affected users
      const userIds = [...new Set(viewData.map(item => item.userId))];
      for (const userId of userIds) {
        await CacheService.del(`recent:${userId}*`);
      }
      
    } catch (error) {
      console.error('Error batch tracking views:', error);
    }
  }
};

module.exports = RecentlyViewedService;