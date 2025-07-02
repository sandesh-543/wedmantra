const notificationService = require('../services/notificationService');

// Get all notifications for the logged-in user
async function getAllNotifications(req, res, next) {
  try {
    const notifications = await notificationService.getAllNotifications(req.user.id);
    res.json({ success: true, notifications });
  } catch (err) {
    next(err);
  }
}

// Get unread notifications for the logged-in user
async function getUnreadNotifications(req, res, next) {
  try {
    const notifications = await notificationService.getUnreadNotifications(req.user.id);
    res.json({ success: true, notifications });
  } catch (err) {
    next(err);
  }
}

// Mark a notification as read
async function markAsRead(req, res, next) {
  try {
    const notification = await notificationService.markAsRead(req.params.id, req.user.id);
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }
    res.json({ success: true, notification });
  } catch (err) {
    next(err);
  }
}

// Delete a notification
async function deleteNotification(req, res, next) {
  try {
    await notificationService.deleteNotification(req.params.id, req.user.id);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

// Admin: Create notification(s) for user(s)
async function createNotification(req, res, next) {
  try {
    // Only admin/superadmin allowed (assume req.user.role checked in route)
    const { userIds, type, title, message, data } = req.body;
    let result;
    if (userIds && Array.isArray(userIds)) {
      result = await notificationService.createNotificationsBulk({ userIds, type, title, message, data });
    } else {
      // Single user (admin can send to self or one user)
      result = await notificationService.createNotification({
        user_id: req.body.user_id,
        type,
        title,
        message,
        data,
      });
    }
    res.status(201).json({ success: true, notification: result });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAllNotifications,
  getUnreadNotifications,
  markAsRead,
  deleteNotification,
  createNotification,
}; 