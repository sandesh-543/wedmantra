const redis = require('../config/redis');

const CacheMonitor = {
  // Get cache statistics
  async getStats() {
    try {
      const info = await redis.info();
      const keys = await redis.dbsize();
      
      return {
        keys,
        info: info.split('\r\n').reduce((acc, line) => {
          const [key, value] = line.split(':');
          if (key && value) {
            acc[key] = value;
          }
          return acc;
        }, {})
      };
    } catch (error) {
      console.error('Cache stats error:', error);
      return null;
    }
  },

  // Get cache hit/miss ratio
  async getHitRatio() {
    try {
      const info = await redis.info('stats');
      const lines = info.split('\r\n');
      
      let keyspaceHits = 0;
      let keyspaceMisses = 0;
      
      lines.forEach(line => {
        if (line.startsWith('keyspace_hits:')) {
          keyspaceHits = parseInt(line.split(':')[1]);
        }
        if (line.startsWith('keyspace_misses:')) {
          keyspaceMisses = parseInt(line.split(':')[1]);
        }
      });
      
      const total = keyspaceHits + keyspaceMisses;
      const hitRatio = total > 0 ? (keyspaceHits / total * 100).toFixed(2) : 0;
      
      return {
        hits: keyspaceHits,
        misses: keyspaceMisses,
        total,
        hitRatio: `${hitRatio}%`
      };
    } catch (error) {
      console.error('Cache hit ratio error:', error);
      return null;
    }
  },

  // Clear all cache
  async clearAll() {
    try {
      await redis.flushall();
      console.log('All cache cleared');
      return true;
    } catch (error) {
      console.error('Clear cache error:', error);
      return false;
    }
  },

  // Get memory usage
  async getMemoryUsage() {
    try {
      const info = await redis.info('memory');
      const lines = info.split('\r\n');
      
      let usedMemory = 0;
      let maxMemory = 0;
      
      lines.forEach(line => {
        if (line.startsWith('used_memory:')) {
          usedMemory = parseInt(line.split(':')[1]);
        }
        if (line.startsWith('maxmemory:')) {
          maxMemory = parseInt(line.split(':')[1]);
        }
      });
      
      return {
        usedMemory: `${(usedMemory / 1024 / 1024).toFixed(2)} MB`,
        maxMemory: maxMemory > 0 ? `${(maxMemory / 1024 / 1024).toFixed(2)} MB` : 'No limit',
        usagePercentage: maxMemory > 0 ? `${(usedMemory / maxMemory * 100).toFixed(2)}%` : 'N/A'
      };
    } catch (error) {
      console.error('Memory usage error:', error);
      return null;
    }
  }
};

module.exports = CacheMonitor; 