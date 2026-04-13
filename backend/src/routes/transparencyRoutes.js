const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const pool = require('../config/database');

// Public route: Get farmer transparency by farmer ID (no login needed)
router.get('/farmer/:farmerId', async (req, res, next) => {
  try {
    const { farmerId } = req.params;

    // Get farmer details
    const farmerQuery = 'SELECT * FROM farmers WHERE id = $1';
    const farmerResult = await pool.query(farmerQuery, [farmerId]);

    if (farmerResult.rows.length === 0) {
      return res.status(404).json({ error: 'Farmer not found' });
    }

    const farmer = farmerResult.rows[0];

    // Get transaction history with all details
    const historyQuery = `
      SELECT 
        t.*,
        c.crop_type,
        f.farmer_name,
        b.company_name as buyer_name,
        fp.organization_name as fpo_name,
        gr.final_grade,
        gr.final_score
      FROM transactions t
      JOIN farmers f ON t.farmer_id = f.id
      JOIN buyers b ON t.buyer_id = b.id
      JOIN fpos fp ON t.fpo_id = fp.id
      JOIN product_listings pl ON t.product_listing_id = pl.id
      JOIN crops c ON pl.crop_id = c.id
      JOIN grading_results gr ON pl.grading_result_id = gr.id
      WHERE t.farmer_id = $1 AND t.transaction_status = 'completed'
      ORDER BY t.created_at DESC
    `;

    const historyResult = await pool.query(historyQuery, [farmerId]);

    res.json({
      success: true,
      farmer: {
        id: farmer.id,
        name: farmer.farmer_name,
        location: farmer.plot_location,
        experience: farmer.years_of_experience,
        plotSize: farmer.plot_size
      },
      transactions: historyResult.rows,
      totalTransactions: historyResult.rows.length
    });
  } catch (error) {
    next(error);
  }
});

// Public route: Get farmer price history by farmer ID
router.get('/farmer/:farmerId/prices', async (req, res, next) => {
  try {
    const { farmerId } = req.params;

    const query = `
      SELECT 
        ph.*,
        t.created_at as transaction_date
      FROM price_history ph
      JOIN transactions t ON ph.transaction_id = t.id
      WHERE ph.farmer_id = $1
      ORDER BY ph.recorded_at DESC
      LIMIT 100
    `;

    const result = await pool.query(query, [farmerId]);

    const summary = {
      totalTransactions: result.rows.length,
      avgPrice: result.rows.length > 0 
        ? (result.rows.reduce((sum, r) => sum + r.price_received, 0) / result.rows.length).toFixed(2)
        : 0,
      avgMarketPrice: result.rows.length > 0 
        ? (result.rows.reduce((sum, r) => sum + r.market_price_at_time, 0) / result.rows.length).toFixed(2)
        : 0,
      avgTransparency: result.rows.length > 0 
        ? (result.rows.reduce((sum, r) => sum + r.transparency_score, 0) / result.rows.length * 100).toFixed(1) + '%'
        : 'N/A'
    };

    res.json({
      success: true,
      summary,
      priceHistory: result.rows
    });
  } catch (error) {
    next(error);
  }
});

// Public route: Get full transaction trace by transaction ID
router.get('/trace/:transactionId', async (req, res, next) => {
  try {
    const { transactionId } = req.params;

    const query = `
      SELECT 
        t.*,
        f.farmer_name,
        f.plot_location,
        f.plot_gps_lat,
        f.plot_gps_lon,
        fp.organization_name as fpo_name,
        b.company_name as buyer_name,
        c.crop_type,
        c.planting_date,
        gr.final_grade,
        gr.final_score,
        ic.overall_quality_score as image_quality,
        ic.spoilage_percentage,
        ic.freshness_score,
        iot.environmental_quality_score as iot_quality,
        iot.temperature,
        iot.humidity
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

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    res.json({
      success: true,
      traceability: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
