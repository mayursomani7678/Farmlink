const pool = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class TransactionService {
  /**
   * Create a transaction (sale)
   */
  async createTransaction(transactionData) {
    const {
      productListingId,
      buyerId,
      fpoId,
      farmerId,
      quantitySold,
      pricePerUnit,
      grade
    } = transactionData;

    const id = uuidv4();
    const totalPrice = quantitySold * pricePerUnit;

    const query = `
      INSERT INTO transactions 
      (id, product_listing_id, buyer_id, fpo_id, farmer_id, quantity_sold, price_per_unit, 
       total_price, grade, transaction_status, payment_status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending', 'pending')
      RETURNING *;
    `;

    const values = [
      id, productListingId, buyerId, fpoId, farmerId, 
      quantitySold, pricePerUnit, totalPrice, grade
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Complete transaction
   */
  async completeTransaction(transactionId, paymentStatus = 'completed') {
    const query = `
      UPDATE transactions 
      SET transaction_status = 'completed', 
          payment_status = $2,
          completed_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *;
    `;

    const result = await pool.query(query, [transactionId, paymentStatus]);
    return result.rows[0];
  }

  /**
   * Get transaction history for farmer (transparency)
   */
  async getFarmerTransactionHistory(farmerId, limit = 50) {
    const query = `
      SELECT 
        t.*,
        c.crop_type,
        f.farmer_name,
        b.company_name as buyer_name,
        u.email as buyer_email,
        fp.organization_name as fpo_name
      FROM transactions t
      JOIN farmers f ON t.farmer_id = f.id
      JOIN buyers b ON t.buyer_id = b.id
      JOIN users u ON b.user_id = u.id
      JOIN fpos fp ON t.fpo_id = fp.id
      JOIN product_listings pl ON t.product_listing_id = pl.id
      JOIN crops c ON pl.crop_id = c.id
      WHERE t.farmer_id = $1
      ORDER BY t.created_at DESC
      LIMIT $2
    `;

    const result = await pool.query(query, [farmerId, limit]);
    return result.rows;
  }

  /**
   * Get buyer transaction history
   */
  async getBuyerTransactionHistory(buyerId, limit = 50) {
    const query = `
      SELECT 
        t.*,
        c.crop_type,
        f.farmer_name,
        fp.organization_name as fpo_name,
        gr.final_grade
      FROM transactions t
      JOIN farmers f ON t.farmer_id = f.id
      JOIN fpos fp ON t.fpo_id = fp.id
      JOIN product_listings pl ON t.product_listing_id = pl.id
      JOIN crops c ON pl.crop_id = c.id
      JOIN grading_results gr ON pl.grading_result_id = gr.id
      WHERE t.buyer_id = $1
      ORDER BY t.created_at DESC
      LIMIT $2
    `;

    const result = await pool.query(query, [buyerId, limit]);
    return result.rows;
  }

  /**
   * Get end-to-end transaction traceability
   */
  async getTransactionTraceability(transactionId) {
    const query = `
      SELECT 
        t.id as transaction_id,
        t.created_at as transaction_date,
        t.quantity_sold,
        t.price_per_unit,
        t.total_price,
        t.grade,
        f.farmer_name,
        f.plot_location,
        f.plot_gps_lat,
        f.plot_gps_lon,
        fp.organization_name as fpo_name,
        b.company_name as buyer_name,
        c.crop_type,
        c.planting_date,
        c.expected_harvest_date,
        gr.final_grade,
        gr.final_score,
        ic.overall_quality_score as image_quality,
        iot.environmental_quality_score as iot_quality
      FROM transactions t
      JOIN farmers f ON t.farmer_id = f.id
      JOIN fpos fp ON t.fpo_id = fp.id
      JOIN buyers b ON t.buyer_id = b.id
      JOIN product_listings pl ON t.product_listing_id = pl.id
      JOIN crops c ON pl.crop_id = c.id
      JOIN grading_results gr ON pl.grading_result_id = gr.id
      LEFT JOIN image_quality_certificates ic ON gr.image_cert_id = ic.id
      LEFT JOIN iot_quality_certificates iot ON gr.iot_cert_id = iot.id
      WHERE t.id = $1
    `;

    const result = await pool.query(query, [transactionId]);
    return result.rows[0];
  }

  /**
   * Get transaction analytics
   */
  async getTransactionAnalytics(fpoId) {
    const query = `
      SELECT 
        COUNT(*) as total_transactions,
        SUM(quantity_sold) as total_quantity_sold,
        SUM(total_price) as total_revenue,
        AVG(price_per_unit) as avg_price_per_unit,
        COUNT(CASE WHEN grade = 'A' THEN 1 END) as grade_a_count,
        COUNT(CASE WHEN grade = 'B' THEN 1 END) as grade_b_count,
        COUNT(CASE WHEN grade = 'C' THEN 1 END) as grade_c_count
      FROM transactions
      WHERE fpo_id = $1 AND transaction_status = 'completed'
    `;

    const result = await pool.query(query, [fpoId]);
    return result.rows[0];
  }
}

module.exports = new TransactionService();
