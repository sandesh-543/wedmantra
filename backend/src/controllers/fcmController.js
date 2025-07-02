const fcmService = require('../services/fcmService');

// Register or update a user's FCM token
async function registerToken(req, res, next) {
  try {
    const { token, device_type } = req.body;
    if (!token || !device_type) {
      return res.status(400).json({ success: false, message: 'token and device_type are required' });
    }
    const result = await fcmService.registerToken({ user_id: req.user.id, token, device_type });
    res.json({ success: true, token: result });
  } catch (err) {
    next(err);
  }
}

// Remove a user's FCM token
async function removeToken(req, res, next) {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ success: false, message: 'token is required' });
    }
    await fcmService.removeToken({ user_id: req.user.id, token });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

// Send a push notification (admin only)
async function sendNotification(req, res, next) {
  try {
    const { userIds, title, body, data } = req.body;
    if (!userIds || !Array.isArray(userIds) || !title || !body) {
      return res.status(400).json({ success: false, message: 'userIds, title, and body are required' });
    }
    const result = await fcmService.sendNotification({ userIds, title, body, data });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  registerToken,
  removeToken,
  sendNotification,
}; 