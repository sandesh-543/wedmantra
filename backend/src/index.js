const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit');

// Load environment variables
dotenv.config();

const app = express();

// Rate limiter for public endpoints
const publicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again later.'
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

// Use rate limiter for public APIs
app.use('/api/auth', publicLimiter, authRoutes);
app.use('/api/products', publicLimiter, productRoutes);
app.use('/api/categories', publicLimiter, categoryRoutes);
app.use('/api/brands', publicLimiter, brandRoutes);
app.use('/api/subcategories', publicLimiter, subcategoryRoutes);
app.use('/api/banners', publicLimiter, bannerRoutes);
app.use('/api/coupons', publicLimiter, couponRoutes);
app.use('/api/payments', publicLimiter, paymentRoutes);
app.use('/health', publicLimiter);

// Use routes (protected or less sensitive)
app.use('/api/cart', cartRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/fcm', fcmRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Wedmantra Backend is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;