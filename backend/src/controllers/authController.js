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
  // TODO: Add OTP, password reset endpoints
};

module.exports = AuthController; 