const admin = require('firebase-admin');
const fcmModel = require('../models/fcmModel');

// Initialize Firebase Admin SDK using .env variables
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
  });
}

// Register or update a user's FCM token
async function registerToken({ user_id, token, device_type }) {
  return fcmModel.registerToken({ user_id, token, device_type });
}

// Remove a user's FCM token
async function removeToken({ user_id, token }) {
  return fcmModel.removeToken({ user_id, token });
}

// Send a notification to one or more users
async function sendNotification({ userIds, title, body, data }) {
  // Get tokens for users
  const tokens = userIds && userIds.length
    ? (await fcmModel.getTokensByUsers(userIds)).map(r => r.token)
    : [];
  if (!tokens.length) return { success: false, message: 'No tokens found' };
  const message = {
    notification: { title, body },
    data: data || {},
    tokens,
  };
  // Use sendMulticast for multiple tokens
  const response = await admin.messaging().sendMulticast(message);
  return { success: true, response };
}

module.exports = {
  registerToken,
  removeToken,
  sendNotification,
}; 