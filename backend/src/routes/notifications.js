const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authenticate, authorize } = require('../middlewares/authMiddleware');

// All routes require authentication
router.use(authenticate);

// User routes
router.get('/', notificationController.getAllNotifications);
router.get('/unread', notificationController.getUnreadNotifications);
router.patch('/:id/read', notificationController.markAsRead);
router.delete('/:id', notificationController.deleteNotification);

// Admin route to send notification(s)
router.post('/', authorize(['admin', 'superadmin']), notificationController.createNotification);

module.exports = router; 