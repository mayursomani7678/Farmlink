const pool = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class Farmer {
  static async create(farmerData) {
    const { fpoId, farmerName, phone, plotSize, plotLocation, plotLat, plotLon, yearsOfExperience, aadharNumber } = farmerData;
    const id = uuidv4();
    
    const query = `
      INSERT INTO farmers (id, fpo_id, farmer_name, phone, plot_size, plot_location, plot_gps_lat, plot_gps_lon, years_of_experience, aadhar_number)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *;
    `;
    
    const values = [id, fpoId, farmerName, phone, plotSize, plotLocation, plotLat, plotLon, yearsOfExperience, aadharNumber];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async findById(id) {
    const query = 'SELECT * FROM farmers WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async findByFpoId(fpoId) {
    const query = 'SELECT * FROM farmers WHERE fpo_id = $1 ORDER BY created_at DESC';
    const result = await pool.query(query, [fpoId]);
    return result.rows;
  }

  static async update(id, farmerData) {
    const { farmerName, phone, plotSize, plotLocation, yearsOfExperience } = farmerData;
    const query = `
      UPDATE farmers 
      SET farmer_name = $2, phone = $3, plot_size = $4, plot_location = $5, years_of_experience = $6, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *;
    `;
    
    const result = await pool.query(query, [id, farmerName, phone, plotSize, plotLocation, yearsOfExperience]);
    return result.rows[0];
  }

  static async delete(id) {
    const query = 'DELETE FROM farmers WHERE id = $1 RETURNING id';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }
}

module.exports = Farmer;
