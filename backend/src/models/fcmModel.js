const db = require('../config/db');

// Register or update an FCM token for a user
async function registerToken({ user_id, token, device_type }) {
  // Upsert: if token exists, update; else insert
  const result = await db.query(
    `INSERT INTO fcm_tokens (user_id, token, device_type, created_at)
     VALUES ($1, $2, $3, NOW())
     ON CONFLICT (token) DO UPDATE SET user_id = $1, device_type = $3, created_at = NOW()
     RETURNING *`,
    [user_id, token, device_type]
  );
  return result.rows[0];
}

// Remove an FCM token
async function removeToken({ user_id, token }) {
  await db.query(
    `DELETE FROM fcm_tokens WHERE user_id = $1 AND token = $2`,
    [user_id, token]
  );
}

// Get all tokens for a user
async function getTokensByUser(user_id) {
  const result = await db.query(
    `SELECT token FROM fcm_tokens WHERE user_id = $1`,
    [user_id]
  );
  return result.rows.map(r => r.token);
}

// Get tokens for multiple users
async function getTokensByUsers(userIds) {
  if (!userIds || userIds.length === 0) return [];
  const params = userIds.map((_, i) => `$${i + 1}`).join(', ');
  const result = await db.query(
    `SELECT user_id, token FROM fcm_tokens WHERE user_id IN (${params})`,
    userIds
  );
  return result.rows;
}

module.exports = {
  registerToken,
  removeToken,
  getTokensByUser,
  getTokensByUsers,
}; 