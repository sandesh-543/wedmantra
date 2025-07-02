const notificationModel = require('../models/notificationModel');

async function createNotification(data) {
  // data: { user_id, type, title, message, data }
  if (!data.user_id || !data.type || !data.title || !data.message) {
    throw new Error('Missing required fields');
  }
  return notificationModel.createNotification(data);
}

async function createNotificationsBulk({ userIds, type, title, message, data }) {
  if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
    throw new Error('userIds array required');
  }
  if (!type || !title || !message) {
    throw new Error('Missing required fields');
  }
  return notificationModel.createNotificationsBulk({ userIds, type, title, message, data });
}

async function getAllNotifications(user_id) {
  return notificationModel.getNotificationsByUser(user_id);
}

async function getUnreadNotifications(user_id) {
  return notificationModel.getUnreadNotifications(user_id);
}

async function markAsRead(id, user_id) {
  return notificationModel.markNotificationAsRead(id, user_id);
}

async function deleteNotification(id, user_id) {
  return notificationModel.deleteNotification(id, user_id);
}

module.exports = {
  createNotification,
  createNotificationsBulk,
  getAllNotifications,
  getUnreadNotifications,
  markAsRead,
  deleteNotification,
}; 