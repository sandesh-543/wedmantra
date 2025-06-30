const UserModel = require('../models/userModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const UserService = {
  async register(userData) {
    // TODO: Add validation
    return await UserModel.create(userData);
  },
  async login(email, password) {
    const user = await UserModel.findByEmail(email);
    if (!user) throw new Error('User not found');
    
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) throw new Error('Invalid password');
    
    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });
    return { user, token };
  },
  async getProfile(userId) {
    return await UserModel.findById(userId);
  },
  async updateProfile(userId, updates) {
    return await UserModel.update(userId, updates);
  },
  // TODO: Add OTP, password reset methods
};

module.exports = UserService; 