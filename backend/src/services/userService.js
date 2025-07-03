const UserModel = require('../models/userModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const OTPUtils = require('../utils/otpUtils');
const db = require('../config/db');
const nodemailer = require('nodemailer');

const UserService = {
  async register(userData) {
    // Validation
    if (!userData.email || !userData.password || !userData.full_name) {
      throw new Error('Email, password, and full name are required');
    }
    
    // Check if user already exists
    const existingUser = await UserModel.findByEmail(userData.email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(userData.password, saltRounds);
    
    const userToCreate = {
      ...userData,
      password_hash: hashedPassword,
      role: userData.role || 'customer'
    };

    return await UserModel.create(userToCreate);
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
    // Don't allow role updates through profile update
    const { role, ...safeUpdates } = updates;
    return await UserModel.update(userId, safeUpdates);
  },

  // OTP and password reset methods
  async sendPasswordResetOTP(email) {
    const user = await UserModel.findByEmail(email);
    if (!user) throw new Error('User not found');

    const otp = OTPUtils.generateOTP();
    const expiryTime = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store OTP in database
    await db.query(
      `INSERT INTO otp_verifications (email, otp_code, otp_type, user_id, expires_at, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [email, otp, 'password_reset', user.id, expiryTime]
    );

    // Send email with OTP
    await this.sendPasswordResetEmail(email, otp);

    return { success: true, message: 'Password reset OTP sent to your email' };
  },

  async verifyPasswordResetOTP(email, otp) {
    const result = await db.query(
      `SELECT * FROM otp_verifications 
       WHERE email = $1 AND otp_code = $2 AND otp_type = 'password_reset' 
       AND expires_at > NOW() AND is_verified = false
       ORDER BY created_at DESC LIMIT 1`,
      [email, otp]
    );

    if (result.rows.length === 0) {
      throw new Error('Invalid or expired OTP');
    }

    const otpRecord = result.rows[0];
    
    // Mark OTP as verified
    await db.query(
      `UPDATE otp_verifications SET is_verified = true, verified_at = NOW() WHERE id = $1`,
      [otpRecord.id]
    );

    return { success: true, message: 'OTP verified successfully' };
  },

  async resetPassword(email, otp, newPassword) {
    // Verify OTP first
    await this.verifyPasswordResetOTP(email, otp);

    // Hash new password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update user password
    await UserModel.updatePasswordByEmail(email, hashedPassword);

    return { success: true, message: 'Password reset successfully' };
  },

  async sendPhoneVerificationOTP(phone, userId) {
    const otp = OTPUtils.generateOTP();
    const expiryTime = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store OTP in database
    await db.query(
      `INSERT INTO otp_verifications (phone, otp_code, otp_type, user_id, expires_at, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [phone, otp, 'phone_verification', userId, expiryTime]
    );

    // Send SMS via Twilio
    const message = `Your phone verification OTP is ${otp}. Valid for 10 minutes.`;
    await OTPUtils.sendSMS(phone, message);

    return { success: true, message: 'Phone verification OTP sent' };
  },

  async verifyPhoneOTP(phone, otp, userId) {
    const result = await db.query(
      `SELECT * FROM otp_verifications 
       WHERE phone = $1 AND otp_code = $2 AND otp_type = 'phone_verification' 
       AND user_id = $3 AND expires_at > NOW() AND is_verified = false
       ORDER BY created_at DESC LIMIT 1`,
      [phone, otp, userId]
    );

    if (result.rows.length === 0) {
      throw new Error('Invalid or expired OTP');
    }

    const otpRecord = result.rows[0];
    
    // Mark OTP as verified
    await db.query(
      `UPDATE otp_verifications SET is_verified = true, verified_at = NOW() WHERE id = $1`,
      [otpRecord.id]
    );

    // Update user phone verification status
    await UserModel.update(userId, { phone_verified: true });

    return { success: true, message: 'Phone verified successfully' };
  },

  async sendPasswordResetEmail(email, otp) {
    // Configure email transporter (you'll need to set up your email service)
    const transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    const mailOptions = {
      from: process.env.SMTP_FROM,
      to: email,
      subject: 'Password Reset OTP - Wedmantra',
      html: `
        <h2>Password Reset Request</h2>
        <p>Your password reset OTP is: <strong>${otp}</strong></p>
        <p>This OTP is valid for 10 minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `
    };

    await transporter.sendMail(mailOptions);
  },

  async changePassword(userId, currentPassword, newPassword) {
    const user = await UserModel.findById(userId);
    if (!user) throw new Error('User not found');

    const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isValidPassword) throw new Error('Current password is incorrect');

    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    await UserModel.updatePassword(userId, hashedPassword);

    return { success: true, message: 'Password changed successfully' };
  }
};

module.exports = UserService; 