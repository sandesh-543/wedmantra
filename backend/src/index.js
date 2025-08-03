const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const swaggerJSDoc = require('swagger-jsdoc');
const morgan = require('morgan');
const helmet = require('helmet');

// Load environment variables
dotenv.config();

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable for development
  crossOriginEmbedderPolicy: false
}));

// Rate limiter for public endpoints
const publicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Increased for mobile apps
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  keyGenerator: (req) => {
    // Use device ID for mobile apps, fallback to IP
    return req.headers['x-device-id'] || req.ip;
  }
});

// Swagger setup
const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Wedmantra E-commerce API',
    version: '1.0.0',
    description: 'API documentation for Wedmantra backend - Saree shopping platform',
  },
  servers: [
    {
      url: process.env.NODE_ENV === 'production' 
        ? 'https://api.wedmantra.com' 
        : 'http://localhost:5000',
      description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
  security: [{ bearerAuth: [] }],
};

const swaggerOptions = {
  swaggerDefinition,
  apis: ['./src/routes/*.js', './src/controllers/*.js'],
};

const swaggerSpec = swaggerJSDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// CORS configuration for mobile apps
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:8100', // Ionic dev server
  'https://admin.wedmantra.com',
  'https://wedmantra.com',
  // Mobile app origins
  'capacitor://localhost',
  'ionic://localhost',
  'http://localhost',
  // Add your production mobile app URLs here
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    }
    
    // Allow all origins in development
    if (process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Device-ID', 
    'X-App-Version',
    'X-Platform'
  ]
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware (development only)
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
} else {
  // Production logging
  app.use(morgan('combined'));
}

// Import performance monitoring middleware
const { performanceMonitor, addResponseTime } = require('./middlewares/performance');
app.use(addResponseTime);
app.use(performanceMonitor);

// Import routes
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const categoryRoutes = require('./routes/categories');
const brandRoutes = require('./routes/brands');
const subcategoryRoutes = require('./routes/subcategories');
const cartRoutes = require('./routes/cart');
const wishlistRoutes = require('./routes/wishlist');
const orderRoutes = require('./routes/orders');
const paymentRoutes = require('./routes/payments');
const couponRoutes = require('./routes/coupons');
const bannerRoutes = require('./routes/banners');
const notificationRoutes = require('./routes/notifications');
const analyticsRoutes = require('./routes/analytics');
const fcmRoutes = require('./routes/fcm');
const addressRoutes = require('./routes/addresses');
// Mobile-specific routes
const mobileRoutes = require('./routes/mobile');

// Apply rate limiting to public APIs
app.use('/api/auth', publicLimiter, authRoutes);
app.use('/api/products', publicLimiter, productRoutes);
app.use('/api/categories', publicLimiter, categoryRoutes);
app.use('/api/brands', publicLimiter, brandRoutes);
app.use('/api/subcategories', publicLimiter, subcategoryRoutes);
app.use('/api/banners', publicLimiter, bannerRoutes);
app.use('/api/coupons', publicLimiter, couponRoutes);
app.use('/api/payments', publicLimiter, paymentRoutes);
app.use('/api/addresses', addressRoutes);
// Mobile API routes (with higher rate limit)
app.use('/api/mobile', publicLimiter, mobileRoutes);

// Protected routes (no rate limiting)
app.use('/api/cart', cartRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/fcm', fcmRoutes);

// Health check endpoint
app.get('/health', async (req, res) => {
  const health = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  };
  
  try {
    // Test database connection
    const db = require('./config/db');
    await db.query('SELECT 1');
    health.database = 'connected';
    
    // Test Redis connection
    const redis = require('./config/redis');
    if (redis?.isReady) {
      await redis.ping();
      health.redis = 'connected';
    } else {
      health.redis = 'disconnected';
    }
    
    res.status(200).json(health);
  } catch (error) {
    health.status = 'ERROR';
    health.database = 'disconnected';
    health.error = error.message;
    res.status(503).json(health);
  }
});

// API root endpoint
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'Wedmantra API is running',
    version: '1.0.0',
    documentation: '/api-docs',
    endpoints: {
      auth: '/api/auth',
      products: '/api/products',
      categories: '/api/categories',
      mobile: '/api/mobile',
      health: '/health'
    }
  });
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ 
    success: false,
    message: 'API endpoint not found',
    path: req.originalUrl 
  });
});

// Global error handling middleware (MUST BE LAST)
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  // Validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: err.errors
    });
  }
  
  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
  
  // Database errors
  if (err.code === '23505') { // PostgreSQL unique violation
    return res.status(409).json({
      success: false,
      message: 'Resource already exists'
    });
  }
  
  // Default error response
  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' 
      ? 'Something went wrong!' 
      : err.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

// 404 handler for non-API routes
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false,
    message: 'Route not found' 
  });
});

module.exports = app;