const UserService = require('../services/userService');

const AuthController = {
  async register(req, res, next) {
    try {
      const user = await UserService.register(req.body);
      res.status(201).json({ message: 'User registered successfully', user });
    } catch (err) {
      next(err);
    }
  },
  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const result = await UserService.login(email, password);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
  async getProfile(req, res, next) {
    try {
      const user = await UserService.getProfile(req.user.id);
      res.json(user);
    } catch (err) {
      next(err);
    }
  },
  async updateProfile(req, res, next) {
    try {
      const user = await UserService.updateProfile(req.user.id, req.body);
      res.json(user);
    } catch (err) {
      next(err);
    }
  },
  // OTP and password reset endpoints
  async sendPasswordResetOTP(req, res, next) {
    try {
      const { email } = req.body;
      const result = await UserService.sendPasswordResetOTP(email);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
  async verifyPasswordResetOTP(req, res, next) {
    try {
      const { email, otp } = req.body;
      const result = await UserService.verifyPasswordResetOTP(email, otp);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
  async resetPassword(req, res, next) {
    try {
      const { email, otp, newPassword } = req.body;
      const result = await UserService.resetPassword(email, otp, newPassword);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
  async sendPhoneVerificationOTP(req, res, next) {
    try {
      const { phone } = req.body;
      const result = await UserService.sendPhoneVerificationOTP(phone, req.user.id);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
  async verifyPhoneOTP(req, res, next) {
    try {
      const { phone, otp } = req.body;
      const result = await UserService.verifyPhoneOTP(phone, otp, req.user.id);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
  async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;
      const result = await UserService.changePassword(req.user.id, currentPassword, newPassword);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
};

module.exports = AuthController; 