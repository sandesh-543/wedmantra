const redis = require('redis');

class RedisManager {
  constructor() {
    this.client = null;
    this.isConnecting = false;
    this.connectionPromise = null;
  }

  async connect() {
    if (this.client && this.client.isOpen) {
      return this.client;
    }

    if (this.isConnecting && this.connectionPromise) {
      return this.connectionPromise;
    }

    this.isConnecting = true;
    this.connectionPromise = this._createConnection();
    
    try {
      await this.connectionPromise;
      return this.client;
    } finally {
      this.isConnecting = false;
    }
  }

  async _createConnection() {
    try {
      console.log('🔄 Creating Redis client...');
      
      // Create client with proper configuration
      this.client = redis.createClient({
        socket: {
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT) || 6379,
          reconnectStrategy: (retries) => {
            if (retries > 10) {
              console.error('❌ Redis max reconnection attempts reached');
              return false;
            }
            const delay = Math.min(retries * 100, 3000);
            console.log(`🔄 Redis reconnecting in ${delay}ms (attempt ${retries})`);
            return delay;
          }
        },
        password: process.env.REDIS_PASSWORD || undefined
      });

      // Set up event handlers
      this.client.on('connect', () => {
        console.log('🔌 Redis connecting...');
      });

      this.client.on('ready', () => {
        console.log('✅ Redis ready');
      });

      this.client.on('error', (err) => {
        console.error('❌ Redis error:', err.message);
      });

      this.client.on('end', () => {
        console.log('⚠️  Redis connection ended');
      });

      // Connect
      console.log('🔄 Connecting to Redis...');
      await this.client.connect();
      
      // Test connection
      const pong = await this.client.ping();
      console.log('🏓 Redis ping response:', pong);
      
      console.log('✅ Redis connection established successfully');
      return this.client;
      
    } catch (error) {
      console.error('💥 Redis connection failed:', error.message);
      this.client = null;
      throw error;
    }
  }

  isConnected() {
    return this.client && this.client.isOpen && this.client.isReady;
  }

  getClient() {
    return this.client;
  }

  async disconnect() {
    if (this.client && this.client.isOpen) {
      try {
        await this.client.quit();
        console.log('✅ Redis disconnected gracefully');
      } catch (error) {
        console.error('❌ Error disconnecting Redis:', error.message);
      }
    }
    this.client = null;
  }
}

// Create singleton instance
const redisManager = new RedisManager();

// Initialize connection when module is loaded
const initializeRedis = async () => {
  try {
    await redisManager.connect();
  } catch (error) {
    console.log('⚠️  Redis initialization failed, continuing without cache');
  }
};

// Start connection
initializeRedis();

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🔄 Shutting down Redis connection...');
  await redisManager.disconnect();
});

process.on('SIGTERM', async () => {
  console.log('🔄 Shutting down Redis connection...');
  await redisManager.disconnect();
});

module.exports = redisManager;