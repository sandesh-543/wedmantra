// Notification Model
const db = require('../config/db');

// Create a notification
async function createNotification({ user_id, type, title, message, data }) {
  const result = await db.query(
    `INSERT INTO notifications (user_id, type, title, message, data, is_read, created_at)
     VALUES ($1, $2, $3, $4, $5, false, NOW()) RETURNING *`,
    [user_id, type, title, message, data ? JSON.stringify(data) : null]
  );
  return result.rows[0];
}

// Get all notifications for a user (most recent first)
async function getNotificationsByUser(user_id) {
  const result = await db.query(
    `SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC`,
    [user_id]
  );
  return result.rows;
}

// Get unread notifications for a user
async function getUnreadNotifications(user_id) {
  const result = await db.query(
    `SELECT * FROM notifications WHERE user_id = $1 AND is_read = false ORDER BY created_at DESC`,
    [user_id]
  );
  return result.rows;
}

// Mark a notification as read
async function markNotificationAsRead(id, user_id) {
  const result = await db.query(
    `UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2 RETURNING *`,
    [id, user_id]
  );
  return result.rows[0];
}

// Delete a notification
async function deleteNotification(id, user_id) {
  await db.query(
    `DELETE FROM notifications WHERE id = $1 AND user_id = $2`,
    [id, user_id]
  );
}

// Bulk create notifications (for admin broadcast)
async function createNotificationsBulk({ userIds, type, title, message, data }) {
  const values = userIds.map((uid, i) => `($${i * 5 + 1}, $${i * 5 + 2}, $${i * 5 + 3}, $${i * 5 + 4}, $${i * 5 + 5}, false, NOW())`).join(', ');
  const params = userIds.flatMap(uid => [uid, type, title, message, data ? JSON.stringify(data) : null]);
  const result = await db.query(
    `INSERT INTO notifications (user_id, type, title, message, data, is_read, created_at) VALUES ${values} RETURNING *`,
    params
  );
  return result.rows;
}

module.exports = {
  createNotification,
  getNotificationsByUser,
  getUnreadNotifications,
  markNotificationAsRead,
  deleteNotification,
  createNotificationsBulk,
}; 