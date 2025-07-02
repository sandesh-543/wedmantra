const db = require('../config/db');
const bcrypt = require('bcryptjs');
const { CacheService, CACHE_TTL } = require('../services/cacheService');

const UserModel = {
  async create(user) {
    const hashedPassword = await bcrypt.hash(user.password, 10);
    const result = await db.query(
      `INSERT INTO users (email, phone, password_hash, first_name, last_name, role)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [user.email, user.phone, hashedPassword, user.first_name, user.last_name, user.role || 'customer']
    );
    
    // Cache the new user
    const userData = result.rows[0];
    await CacheService.set(CacheService.generateKey.user(userData.id), userData, CACHE_TTL.USER);
    
    return userData;
  },
  
  async findByEmail(email) {
    // For login, we don't cache by email for security reasons
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0];
  },
  
  async findById(id) { // why this is not using cache
    const cacheKey = CacheService.generateKey.user(id);
    return await CacheService.cacheWrapper(cacheKey, async () => {
      const result = await db.query('SELECT * FROM users WHERE id = $1', [id]);
      return result.rows[0];
    }, CACHE_TTL.USER);
  },
  
  async update(id, updates) {
    const result = await db.query(
      `UPDATE users SET first_name = $1, last_name = $2, phone = $3, updated_at = NOW() WHERE id = $4 RETURNING *`,
      [updates.first_name, updates.last_name, updates.phone, id]
    );
    
    // Invalidate user cache after update
    await CacheService.del(CacheService.generateKey.user(id));
    
    return result.rows[0];
  },
  
  async changePasswordAuthenticated(id, newPassword) {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const result = await db.query(
      `UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [hashedPassword, id]
    );
    
    // Invalidate user cache after password update
    await CacheService.del(CacheService.generateKey.user(id));
    
    return result.rows[0];
  },
  
  async resetPassword(id, newPassword) {
    // Send password reset email
    // Generate a unique token
    // Store the token in the database
    // Return the token
    const token = crypto.randomBytes(32).toString('hex');
    const result = await db.query(
      `UPDATE users SET password_reset_token = $1, password_reset_expires = NOW() + INTERVAL '1 hour' WHERE id = $2 RETURNING *`,
      [token, id]
    );
    
    // Invalidate user cache after password reset
    await CacheService.del(CacheService.generateKey.user(id));
    
    return result.rows[0];
  },
  
  async verifyPasswordResetToken(id, token) {
    const result = await db.query(
      `SELECT * FROM users WHERE id = $1 AND password_reset_token = $2 AND password_reset_expires > NOW()`,
      [id, token]
    );
    return result.rows[0];
  },
  
  async changePasswordWithResetToken(id, newPassword) {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const result = await db.query(
      `UPDATE users SET password_hash = $1, password_reset_token = NULL, password_reset_expires = NULL WHERE id = $2 RETURNING *`,
      [hashedPassword, id]
    );
    
    // Invalidate user cache after password change
    await CacheService.del(CacheService.generateKey.user(id));
    
    return result.rows[0];
  },
  
  async delete(id) {
    await db.query('DELETE FROM users WHERE id = $1', [id]);
    
    // Invalidate user cache after deletion
    await CacheService.del(CacheService.generateKey.user(id));
  }
};

module.exports = UserModel; 