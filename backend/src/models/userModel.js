const db = require('../config/db');
const bcrypt = require('bcryptjs');
const { CacheService, CACHE_TTL } = require('../services/cacheService');

const UserModel = {
  async create(user) {
    const result = await db.query(
      `INSERT INTO users (email, phone, password_hash, full_name, role, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) RETURNING *`,
      [user.email, user.phone, user.password_hash, user.full_name, user.role || 'customer']
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
  
  async findById(id) {
    const cacheKey = CacheService.generateKey.user(id);
    return await CacheService.cacheWrapper(cacheKey, async () => {
      const result = await db.query('SELECT * FROM users WHERE id = $1', [id]);
      return result.rows[0];
    }, CACHE_TTL.USER);
  },
  
  async update(id, updates) {
    const result = await db.query(
      `UPDATE users SET full_name = $1, phone = $2, phone_verified = $3, updated_at = NOW() WHERE id = $4 RETURNING *`,
      [updates.full_name, updates.phone, updates.phone_verified, id]
    );
    
    // Invalidate user cache after update
    await CacheService.del(CacheService.generateKey.user(id));
    
    return result.rows[0];
  },

  async updatePassword(userId, hashedPassword) {
    const result = await db.query(
      `UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [hashedPassword, userId]
    );
    
    // Invalidate user cache after password update
    await CacheService.del(CacheService.generateKey.user(userId));
    
    return result.rows[0];
  },

  async updatePasswordByEmail(email, hashedPassword) {
    const result = await db.query(
      `UPDATE users SET password_hash = $1, updated_at = NOW() WHERE email = $2 RETURNING *`,
      [hashedPassword, email]
    );
    
    if (result.rows[0]) {
      // Invalidate user cache after password update
      await CacheService.del(CacheService.generateKey.user(result.rows[0].id));
    }
    
    return result.rows[0];
  },
  
  async changePasswordAuthenticated(id, newPassword) {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    return await this.updatePassword(id, hashedPassword);
  },
  
  async delete(id) {
    await db.query('DELETE FROM users WHERE id = $1', [id]);
    
    // Invalidate user cache after deletion
    await CacheService.del(CacheService.generateKey.user(id));
  }
};

module.exports = UserModel; 