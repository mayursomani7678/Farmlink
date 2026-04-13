const pool = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class ProductListingService {
  /**
   * Create a product listing
   */
  async createListing(listingData) {
    const {
      cropId,
      gradingResultId,
      fpoId,
      quantity,
      grade
    } = listingData;

    const id = uuidv4();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    const query = `
      INSERT INTO product_listings 
      (id, crop_id, grading_result_id, fpo_id, quantity, grade, status, expires_at)
      VALUES ($1, $2, $3, $4, $5, $6, 'available', $7)
      RETURNING *;
    `;

    const values = [id, cropId, gradingResultId, fpoId, quantity, grade, expiresAt];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Get marketplace listings
 (with filters)
   */
  async getMarketplaceListings(filters = {}) {
    let query = `
      SELECT 
        pl.*,
        c.crop_type,
        c.estimated_quantity,
        f.farmer_name,
        fp.organization_name as fpo_name,
        gr.final_score
      FROM product_listings pl
      JOIN crops c ON pl.crop_id = c.id
      JOIN farmers f ON c.farmer_id = f.id
      JOIN fpos fp ON pl.fpo_id = fp.id
      JOIN grading_results gr ON pl.grading_result_id = gr.id
      WHERE pl.status = 'available' AND pl.expires_at > CURRENT_TIMESTAMP
    `;

    const values = [];

    // Apply filters
    if (filters.grade) {
      query += ` AND pl.grade = $${values.length + 1}`;
      values.push(filters.grade);
    }

    if (filters.minQuantity) {
      query += ` AND pl.quantity >= $${values.length + 1}`;
      values.push(filters.minQuantity);
    }

    if (filters.cropType) {
      query += ` AND c.crop_type = $${values.length + 1}`;
      values.push(filters.cropType);
    }

    query += ` ORDER BY pl.created_at DESC`;

    const result = await pool.query(query, values);
    return result.rows;
  }

  /**
   * Get listings by FPO
   */
  async getListingsByFpo(fpoId) {
    const query = `
      SELECT 
        pl.*,
        c.crop_type,
        f.farmer_name
      FROM product_listings pl
      JOIN crops c ON pl.crop_id = c.id
      JOIN farmers f ON c.farmer_id = f.id
      WHERE pl.fpo_id = $1
      ORDER BY pl.created_at DESC
    `;

    const result = await pool.query(query, [fpoId]);
    return result.rows;
  }

  /**
   * Get single listing details
   */
  async getListingDetails(listingId) {
    const query = `
      SELECT 
        pl.*,
        c.crop_type,
        c.farmer_id,
        f.farmer_name,
        f.plot_location,
        fp.organization_name as fpo_name,
        gr.final_grade,
        gr.final_score,
        ic.overall_quality_score as image_quality,
        iot.environmental_quality_score as iot_quality
      FROM product_listings pl
      JOIN crops c ON pl.crop_id = c.id
      JOIN farmers f ON c.farmer_id = f.id
      JOIN fpos fp ON pl.fpo_id = fp.id
      JOIN grading_results gr ON pl.grading_result_id = gr.id
      LEFT JOIN image_quality_certificates ic ON gr.image_cert_id = ic.id
      LEFT JOIN iot_quality_certificates iot ON gr.iot_cert_id = iot.id
      WHERE pl.id = $1
    `;

    const result = await pool.query(query, [listingId]);
    return result.rows[0];
  }

  /**
   * Update listing status
   */
  async updateListingStatus(listingId, status) {
    const query = `
      UPDATE product_listings 
      SET status = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *;
    `;

    const result = await pool.query(query, [listingId, status]);
    return result.rows[0];
  }

  /**
   * Reserve quantity from listing
   */
  async reserveQuantity(listingId, quantity) {
    const query = `
      UPDATE product_listings 
      SET quantity = quantity - $2, status = 'reserved', updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND quantity >= $2
      RETURNING *;
    `;

    const result = await pool.query(query, [listingId, quantity]);
    
    if (result.rows.length === 0) {
      throw new Error('Insufficient quantity available');
    }

    return result.rows[0];
  }
}

module.exports = new ProductListingService();
