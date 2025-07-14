const redis = require('../config/redis');

const CACHE_TTL = {
  PRODUCTS: 3600, // 1 hour
  USER: 1800,     // 30 minutes
  CART: 900,      // 15 minutes
  ORDERS: 1800,   // 30 minutes
  WISHLIST: 900,  // 15 minutes
  BANNERS: 7200,  // 2 hours
  COUPONS: 3600,  // 1 hour
  CATEGORIES: 7200 // 2 hours
};

const CacheService = {
  // Check if Redis is available
  isRedisAvailable() {
    return redis && redis.isReady;
  },

  // Get data from cache
  async get(key) {
    if (!this.isRedisAvailable()) {
      console.log('Redis not available, skipping cache get');
      return null;
    }

    try {
      const data = await redis.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Redis get error:', error);
      return null;
    }
  },

  // Set data in cache with TTL
  async set(key, data, ttl = 3600) {
    if (!this.isRedisAvailable()) {
      console.log('Redis not available, skipping cache set');
      return false;
    }

    try {
      await redis.setEx(key, ttl, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('Redis set error:', error);
      return false;
    }
  },

  // Delete cache key
  async del(key) {
    if (!this.isRedisAvailable()) {
      console.log('Redis not available, skipping cache delete');
      return false;
    }

    try {
      await redis.del(key);
      return true;
    } catch (error) {
      console.error('Redis del error:', error);
      return false;
    }
  },

  // Delete multiple keys with pattern
  async delPattern(pattern) {
    if (!this.isRedisAvailable()) {
      console.log('Redis not available, skipping pattern delete');
      return false;
    }

    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(keys);
      }
      return true;
    } catch (error) {
      console.error('Redis delPattern error:', error);
      return false;
    }
  },

  // Cache wrapper for database queries
  async cacheWrapper(key, dbQuery, ttl = 3600) {
    try {
      // Try to get from cache first
      let data = await this.get(key);
      
      if (data) {
        console.log(`Cache HIT for key: ${key}`);
        return data;
      }

      // If not in cache, execute database query
      console.log(`Cache MISS for key: ${key}`);
      data = await dbQuery();
      
      // Store in cache (don't await to avoid blocking)
      if (data) {
        this.set(key, data, ttl).catch(err => 
          console.error('Background cache set failed:', err)
        );
      }
      
      return data;
    } catch (error) {
      console.error('Cache wrapper error:', error);
      // Fallback to database query
      return await dbQuery();
    }
  },

  // Invalidate cache when data changes
  async invalidateCache(pattern) {
    try {
      await this.delPattern(pattern);
      console.log(`Cache invalidated for pattern: ${pattern}`);
    } catch (error) {
      console.error('Cache invalidation error:', error);
    }
  },

  // Generate cache keys
  generateKey: {
    product: (id) => `product:${id}`,
    products: (filters = '') => `products:${filters}`,
    user: (id) => `user:${id}`,
    cart: (userId) => `cart:${userId}`,
    orders: (userId) => `orders:${userId}`,
    order: (id) => `order:${id}`,
    wishlist: (userId) => `wishlist:${userId}`,
    categories: () => 'categories',
    banners: (type = '') => `banners:${type}`,
    coupons: () => 'coupons'
  }
};

module.exports = { CacheService, CACHE_TTL };