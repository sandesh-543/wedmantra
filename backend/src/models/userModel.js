const db = require('../config/db');
const bcrypt = require('bcryptjs');
const { CacheService, CACHE_TTL } = require('../services/cacheService');

const UserModel = {
  async create(user) {
    const result = await db.query(
      `INSERT INTO users (email, phone, password_hash, first_name, last_name, role, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW()) RETURNING *`,
      [user.email, user.phone, user.password_hash, user.first_name, user.last_name, user.role || 'customer']
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
      `UPDATE users SET first_name = $1, last_name = $2, phone = $3, phone_verified = $4, updated_at = NOW() WHERE id = $5 RETURNING *`,
      [updates.first_name, updates.last_name, updates.phone, updates.phone_verified, id]
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
  },

  // Find user by phone
  async findByPhone(phone) {
    try {
      const result = await db.query('SELECT * FROM users WHERE phone = $1', [phone]);
      return result.rows[0];
    } catch (error) {
      console.error('Error finding user by phone:', error);
      throw error;
    }
  },

  // Get all users (for admin)
  async getAll(filters = {}) {
    try {
      let query = 'SELECT id, email, phone, first_name, last_name, role, is_active, email_verified, phone_verified, created_at FROM users';
      const values = [];
      const conditions = [];
      let idx = 1;

      if (filters.role) {
        conditions.push(`role = $${idx++}`);
        values.push(filters.role);
      }
      if (filters.is_active !== undefined) {
        conditions.push(`is_active = $${idx++}`);
        values.push(filters.is_active);
      }

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }

      query += ' ORDER BY created_at DESC';

      if (filters.limit) {
        query += ` LIMIT $${idx++}`;
        values.push(filters.limit);
      }

      const result = await db.query(query, values);
      return result.rows;
    } catch (error) {
      console.error('Error fetching all users:', error);
      throw error;
    }
  },

// Update user status
  async updateStatus(id, isActive) {
    try {
      const result = await db.query(
        'UPDATE users SET is_active = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
        [isActive, id]
      );
      // Invalidate user cache
      await CacheService.del(CacheService.generateKey.user(id));
      return result.rows[0];
    } catch (error) {
      console.error('Error updating user status:', error);
      throw error;
    }
  }
};

module.exports = UserModel; 