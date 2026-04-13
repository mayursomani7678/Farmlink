const pool = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class Crop {
  static async create(cropData) {
    const { farmerId, cropType, plantingDate, expectedHarvestDate, estimatedQuantity, variety } = cropData;
    const id = uuidv4();
    
    const query = `
      INSERT INTO crops (id, farmer_id, crop_type, planting_date, expected_harvest_date, estimated_quantity, variety)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *;
    `;
    
    const values = [id, farmerId, cropType, plantingDate, expectedHarvestDate, estimatedQuantity, variety];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async findById(id) {
    const query = 'SELECT * FROM crops WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async findByFarmerId(farmerId) {
    const query = 'SELECT * FROM crops WHERE farmer_id = $1 ORDER BY created_at DESC';
    const result = await pool.query(query, [farmerId]);
    return result.rows;
  }

  static async findByFpoId(fpoId) {
    const query = `
      SELECT c.* FROM crops c
      JOIN farmers f ON c.farmer_id = f.id
      WHERE f.fpo_id = $1
      ORDER BY c.expected_harvest_date, c.created_at DESC
    `;
    const result = await pool.query(query, [fpoId]);
    return result.rows;
  }

  static async update(id, cropData) {
    const { estimatedQuantity } = cropData;
    const query = `
      UPDATE crops 
      SET estimated_quantity = COALESCE($2, estimated_quantity), 
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *;
    `;
    
    const result = await pool.query(query, [id, estimatedQuantity]);
    return result.rows[0];
  }

  
  /**
   * Mark crop as harvested
   */
  static async markAsHarvested(id) {
    const query = `
      UPDATE crops 
      SET updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *;
    `;
    
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }
}

module.exports = Crop;
