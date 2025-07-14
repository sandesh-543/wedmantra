const db = require('../config/db');
const { CacheService, CACHE_TTL } = require('../services/cacheService');

const AddressModel = {
  // Get all addresses for a user
  async getByUser(userId) {
    const cacheKey = `addresses:user:${userId}`;
    return await CacheService.cacheWrapper(cacheKey, async () => {
      const result = await db.query(
        'SELECT * FROM user_addresses WHERE user_id = $1 ORDER BY is_default DESC, created_at DESC',
        [userId]
      );
      return result.rows;
    }, CACHE_TTL.USER);
  },

  // Get address by ID
  async getById(id, userId) {
    const result = await db.query(
      'SELECT * FROM user_addresses WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    return result.rows[0];
  },

  // Create new address
  async create(userId, addressData) {
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');

      // If this is the default address, remove default from others
      if (addressData.is_default) {
        await client.query(
          'UPDATE user_addresses SET is_default = false WHERE user_id = $1',
          [userId]
        );
      }

      // If user has no addresses, make this one default
      const existingCount = await client.query(
        'SELECT COUNT(*) FROM user_addresses WHERE user_id = $1',
        [userId]
      );
      
      const isFirstAddress = parseInt(existingCount.rows[0].count) === 0;
      const shouldBeDefault = addressData.is_default || isFirstAddress;

      const result = await client.query(
        `INSERT INTO user_addresses 
         (user_id, type, full_name, phone, address_line1, address_line2, 
          city, state, pincode, landmark, is_default, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW()) 
         RETURNING *`,
        [
          userId,
          addressData.type || 'home',
          addressData.full_name,
          addressData.phone,
          addressData.address_line1,
          addressData.address_line2,
          addressData.city,
          addressData.state,
          addressData.pincode,
          addressData.landmark,
          shouldBeDefault
        ]
      );

      await client.query('COMMIT');
      
      // Invalidate cache
      await CacheService.del(`addresses:user:${userId}`);
      
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  // Update address
  async update(id, userId, addressData) {
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');

      // Check if address belongs to user
      const existing = await client.query(
        'SELECT * FROM user_addresses WHERE id = $1 AND user_id = $2',
        [id, userId]
      );

      if (existing.rows.length === 0) {
        throw new Error('Address not found');
      }

      // If setting as default, remove default from others
      if (addressData.is_default) {
        await client.query(
          'UPDATE user_addresses SET is_default = false WHERE user_id = $1 AND id != $2',
          [userId, id]
        );
      }

      const result = await client.query(
        `UPDATE user_addresses SET 
         type = $1, full_name = $2, phone = $3, address_line1 = $4, 
         address_line2 = $5, city = $6, state = $7, pincode = $8, 
         landmark = $9, is_default = $10, updated_at = NOW()
         WHERE id = $11 AND user_id = $12 RETURNING *`,
        [
          addressData.type || existing.rows[0].type,
          addressData.full_name || existing.rows[0].full_name,
          addressData.phone || existing.rows[0].phone,
          addressData.address_line1 || existing.rows[0].address_line1,
          addressData.address_line2,
          addressData.city || existing.rows[0].city,
          addressData.state || existing.rows[0].state,
          addressData.pincode || existing.rows[0].pincode,
          addressData.landmark,
          addressData.is_default !== undefined ? addressData.is_default : existing.rows[0].is_default,
          id,
          userId
        ]
      );

      await client.query('COMMIT');
      
      // Invalidate cache
      await CacheService.del(`addresses:user:${userId}`);
      
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  // Delete address
  async delete(id, userId) {
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');

      // Check if address belongs to user and get current default status
      const existing = await client.query(
        'SELECT * FROM user_addresses WHERE id = $1 AND user_id = $2',
        [id, userId]
      );

      if (existing.rows.length === 0) {
        throw new Error('Address not found');
      }

      const wasDefault = existing.rows[0].is_default;

      // Delete the address
      await client.query(
        'DELETE FROM user_addresses WHERE id = $1 AND user_id = $2',
        [id, userId]
      );

      // If deleted address was default, make another one default
      if (wasDefault) {
        await client.query(
          `UPDATE user_addresses SET is_default = true 
           WHERE user_id = $1 AND id = (
             SELECT id FROM user_addresses WHERE user_id = $1 
             ORDER BY created_at ASC LIMIT 1
           )`,
          [userId]
        );
      }

      await client.query('COMMIT');
      
      // Invalidate cache
      await CacheService.del(`addresses:user:${userId}`);
      
      return { message: 'Address deleted successfully' };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  // Set default address
  async setDefault(id, userId) {
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');

      // Check if address belongs to user
      const existing = await client.query(
        'SELECT * FROM user_addresses WHERE id = $1 AND user_id = $2',
        [id, userId]
      );

      if (existing.rows.length === 0) {
        throw new Error('Address not found');
      }

      // Remove default from all addresses
      await client.query(
        'UPDATE user_addresses SET is_default = false WHERE user_id = $1',
        [userId]
      );

      // Set this address as default
      const result = await client.query(
        'UPDATE user_addresses SET is_default = true WHERE id = $1 AND user_id = $2 RETURNING *',
        [id, userId]
      );

      await client.query('COMMIT');
      
      // Invalidate cache
      await CacheService.del(`addresses:user:${userId}`);
      
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  // Get default address
  async getDefault(userId) {
    const result = await db.query(
      'SELECT * FROM user_addresses WHERE user_id = $1 AND is_default = true',
      [userId]
    );
    return result.rows[0];
  }
};

module.exports = AddressModel;