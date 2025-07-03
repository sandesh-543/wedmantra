const twilio = require('twilio');
const db = require('../config/db');

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

const OTP_EXPIRY_MINUTES = 10;

const OTPUtils = {
  // Generate a random 6-digit OTP
  generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  },

  // Send SMS via Twilio
  async sendSMS(phoneNumber, message) {
    try {
      await client.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phoneNumber
      });
      return { success: true, message: 'SMS sent successfully' };
    } catch (error) {
      console.error('SMS sending failed:', error);
      throw new Error('Failed to send SMS');
    }
  },

  // Send OTP via SMS using Twilio
  async sendOtpToPhone(phoneNumber, orderId) {
    const otp = this.generateOTP();
    const expiryTime = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
    
    // Store OTP in database
    await db.query(
      `INSERT INTO otp_verifications (phone, otp_code, otp_type, user_id, expires_at, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())`,
      [phoneNumber, otp, 'cod_verification', null, expiryTime]
    );

    // Send SMS via Twilio
    const message = `Your OTP for COD order #${orderId} is ${otp}. Valid for ${OTP_EXPIRY_MINUTES} minutes.`;
    await this.sendSMS(phoneNumber, message);

    return { success: true, message: 'OTP sent successfully' };
  },

  // Verify OTP
  async verifyOtp(phoneNumber, orderId, otp) {
    const result = await db.query(
      `SELECT * FROM otp_verifications 
       WHERE phone = $1 AND otp_code = $2 AND otp_type = 'cod_verification' 
       AND expires_at > NOW() AND is_verified = false
       ORDER BY created_at DESC LIMIT 1`,
      [phoneNumber, otp]
    );

    if (result.rows.length === 0) {
      return false;
    }

    const otpRecord = result.rows[0];
    
    // Mark OTP as verified
    await db.query(
      `UPDATE otp_verifications SET is_verified = true, verified_at = NOW() WHERE id = $1`,
      [otpRecord.id]
    );

    return true;
  },

  // Clean up expired OTPs
  async cleanupExpiredOTPs() {
    await db.query(
      `DELETE FROM otp_verifications WHERE expires_at < NOW() AND is_verified = false`
    );
  },
};

module.exports = OTPUtils; 