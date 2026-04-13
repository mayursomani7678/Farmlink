const pool = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class User {
  static async create(userData) {
    const { email, passwordHash, fullName, userType, phone, location } = userData;
    const id = uuidv4();
    
    const query = `
      INSERT INTO users (id, email, password_hash, full_name, user_type, phone, location)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, email, full_name, user_type, phone, location, created_at;
    `;
    
    const values = [id, email, passwordHash, fullName, userType, phone, location];
    console.log('💻 [USER.CREATE] Executing INSERT query with values:', { email, fullName, userType });
    
    try {
      const result = await pool.query(query, values);
      console.log('✅ [USER.CREATE] Query successful, rows returned:', result.rows.length);
      return result.rows[0];
    } catch (err) {
      console.error('❌ [USER.CREATE] Database query failed:', {
        code: err.code,
        message: err.message,
        detail: err.detail
      });
      throw err;
    }
  }

  static async findByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await pool.query(query, [email]);
    return result.rows[0];
  }

  static async findById(id) {
    const query = 'SELECT id, email, full_name, user_type, phone, location, created_at FROM users WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async findByIdWithPassword(id) {
    const query = 'SELECT * FROM users WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async updateProfile(id, userData) {
    const { fullName, phone, location } = userData;
    const query = `
      UPDATE users 
      SET full_name = $2, phone = $3, location = $4, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING id, email, full_name, user_type, phone, location;
    `;
    
    const result = await pool.query(query, [id, fullName, phone, location]);
    return result.rows[0];
  }

  static async delete(id) {
    const query = 'DELETE FROM users WHERE id = $1 RETURNING id';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }
}

module.exports = User;
