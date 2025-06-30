# Redis Setup Guide

## 1. Install Redis

### Windows:
- Download Redis for Windows from: https://github.com/microsoftarchive/redis/releases
- Or use WSL2 with Ubuntu and install Redis there
- Or use Docker: `docker run -d -p 6379:6379 redis:alpine`

### macOS:
```bash
brew install redis
```

### Linux (Ubuntu):
```bash
sudo apt-get install redis-server
```

## 2. Start Redis Server

### Windows:
```bash
redis-server
```

### macOS/Linux:
```bash
redis-server
# Or as a service:
sudo systemctl start redis
```

## 3. Add Redis Configuration to .env

Add these variables to your `backend/.env` file:

```env
# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
```

## 4. Test Redis Connection

You can test Redis connection using the Redis CLI:
```bash
redis-cli ping
# Should return: PONG
```

## 5. Cache Performance Benefits

With Redis caching implemented, you'll see:
- **Faster API responses** for frequently accessed data
- **Reduced database load** 
- **Better user experience** with faster page loads
- **Scalability** for high-traffic scenarios

## 6. Cache Keys Structure

The system uses these cache key patterns:
- `product:123` - Individual product cache
- `products:` - All products cache
- `user:123` - User profile cache
- `cart:123` - User cart cache
- `orders:123` - User orders cache
- `wishlist:123` - User wishlist cache

## 7. Cache TTL (Time To Live)

- Products: 1 hour
- Users: 30 minutes
- Cart: 15 minutes
- Orders: 30 minutes
- Wishlist: 15 minutes
- Banners: 2 hours
- Categories: 2 hours 