const redisManager = require('../config/redis');

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
    const available = redisManager.isConnected();
    if (!available) {
      console.log('Redis not available for cache operation');
    }
    return available;
  },

  // Ensure Redis connection
  async ensureConnection() {
    if (!redisManager.isConnected()) {
      try {
        await redisManager.connect();
        return true;
      } catch (error) {
        console.error('Failed to connect to Redis:', error.message);
        return false;
      }
    }
    return true;
  },

  // Get data from cache
  async get(key) {
    try {
      const connected = await this.ensureConnection();
      if (!connected) {
        console.log(`Cache SKIP for key: ${key} (Redis unavailable)`);
        return null;
      }

      const client = redisManager.getClient();
      const data = await client.get(key);
      
      if (data) {
        console.log(`Cache HIT for key: ${key}`);
        return JSON.parse(data);
      } else {
        console.log(`Cache MISS for key: ${key}`);
        return null;
      }
    } catch (error) {
      console.error(`Redis get error for key ${key}:`, error.message);
      return null;
    }
  },

  // Set data in cache with TTL
  async set(key, data, ttl = 3600) {
    try {
      const connected = await this.ensureConnection();
      if (!connected) {
        console.log(`Cache SKIP SET for key: ${key} (Redis unavailable)`);
        return false;
      }

      const client = redisManager.getClient();
      await client.setEx(key, ttl, JSON.stringify(data));
      console.log(`Cache SET for key: ${key} (TTL: ${ttl}s)`);
      return true;
    } catch (error) {
      console.error(`Redis set error for key ${key}:`, error.message);
      return false;
    }
  },

  // Delete cache key
  async del(key) {
    try {
      const connected = await this.ensureConnection();
      if (!connected) {
        console.log(`Cache SKIP DEL for key: ${key} (Redis unavailable)`);
        return false;
      }

      const client = redisManager.getClient();
      const result = await client.del(key);
      console.log(`Cache DEL for key: ${key} (deleted: ${result})`);
      return true;
    } catch (error) {
      console.error(`Redis del error for key ${key}:`, error.message);
      return false;
    }
  },

  // Delete multiple keys with pattern
  async delPattern(pattern) {
    try {
      const connected = await this.ensureConnection();
      if (!connected) {
        console.log(`Cache SKIP DEL PATTERN for: ${pattern} (Redis unavailable)`);
        return false;
      }

      const client = redisManager.getClient();
      const keys = await client.keys(pattern);
      if (keys.length > 0) {
        await client.del(keys);
        console.log(`Cache DEL PATTERN: ${pattern} (${keys.length} keys deleted)`);
      }
      return true;
    } catch (error) {
      console.error(`Redis delPattern error for ${pattern}:`, error.message);
      return false;
    }
  },

  // Cache wrapper for database queries
  async cacheWrapper(key, dbQuery, ttl = 3600) {
    try {
      // Try to get from cache first
      let data = await this.get(key);
      
      if (data !== null) {
        return data;
      }

      // If not in cache, execute database query
      console.log(`Executing DB query for key: ${key}`);
      data = await dbQuery();
      
      // Store in cache if data exists
      if (data !== null && data !== undefined) {
        // Don't await to avoid blocking the response
        this.set(key, data, ttl).catch(err => 
          console.error(`Background cache set failed for ${key}:`, err.message)
        );
      }
      
      return data;
    } catch (error) {
      console.error(`Cache wrapper error for ${key}:`, error.message);
      // Fallback to database query
      try {
        return await dbQuery();
      } catch (dbError) {
        console.error(`Database query fallback failed for ${key}:`, dbError.message);
        throw dbError;
      }
    }
  },

  // Invalidate cache when data changes
  async invalidateCache(pattern) {
    try {
      await this.delPattern(pattern);
      console.log(`Cache invalidated for pattern: ${pattern}`);
    } catch (error) {
      console.error(`Cache invalidation error for ${pattern}:`, error.message);
    }
  },

  // Generate cache keys
  generateKey: {
    product: (id) => `product:${id}`,
    products: (filters = '') => {
      // Create a consistent key from filters object
      if (typeof filters === 'object' && filters !== null) {
        const sortedFilters = Object.keys(filters)
          .sort()
          .map(key => `${key}:${filters[key]}`)
          .join('|');
        return `products:${sortedFilters}`;
      }
      return `products:${filters}`;
    },
    user: (id) => `user:${id}`,
    cart: (userId) => `cart:${userId}`,
    orders: (userId) => `orders:${userId}`,
    order: (id) => `order:${id}`,
    wishlist: (userId) => `wishlist:${userId}`,
    categories: () => 'categories',
    banners: (type = '') => `banners:${type}`,
    coupons: () => 'coupons'
  },

  // Debug function to check Redis status
  async debugStatus() {
    console.log('Redis Debug Status:');
    console.log('Redis available:', this.isRedisAvailable());
    
    const connected = await this.ensureConnection();
    console.log('Connection attempt:', connected ? 'Success' : 'Failed');
    
    if (connected) {
      try {
        const client = redisManager.getClient();
        
        // Test set/get
        await client.set('test:debug', 'working', 'EX', 10);
        const testValue = await client.get('test:debug');
        console.log('Test set/get:', testValue === 'working' ? 'Working' : 'Failed');
        
        // Clean up
        await client.del('test:debug');
        
      } catch (error) {
        console.error('Redis debug test failed:', error.message);
      }
    }
    console.log('');
  }
};

module.exports = { CacheService, CACHE_TTL };