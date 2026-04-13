const ProductListingService = require('../services/ProductListingService');
const TransactionService = require('../services/TransactionService');
const MarketPriceService = require('../services/MarketPriceService');
const pool = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class BuyerController {
  /**
   * Get marketplace listings - aggregated by crop type and grade
   */
  async getMarketplace(req, res, next) {
    try {
      const { grade, minQuantity, cropType, page = 1, limit = 20, include_pending = true } = req.query;

      const offset = (page - 1) * limit;

      // Aggregated query - groups by crop type, grade, and verification status
      // Includes both available (verified) and pending verification listings
      let query = `
        SELECT 
          c.crop_type,
          pl.grade,
          pl.verification_status,
          SUM(pl.quantity) as quantity,
          COUNT(*) as listing_count,
          AVG(gr.final_score) as avg_score,
          MAX(pl.created_at) as latest_listing,
          STRING_AGG(DISTINCT f.farmer_name, ', ') as farmer_names,
          STRING_AGG(DISTINCT fp.organization_name, ', ') as fpo_names,
          MIN(pl.price_per_kg) as min_price,
          MAX(pl.price_per_kg) as max_price,
          AVG(pl.price_per_kg) as avg_price
        FROM product_listings pl
        JOIN crops c ON pl.crop_id = c.id
        JOIN farmers f ON c.farmer_id = f.id
        LEFT JOIN fpos fp ON pl.fpo_id = fp.id
        LEFT JOIN grading_results gr ON pl.grading_result_id = gr.id
        WHERE pl.status = 'available' AND pl.quantity > 0 AND pl.expires_at > CURRENT_TIMESTAMP
      `;

      const values = [];

      // Include pending verification listings if requested
      if (include_pending === 'true' || include_pending === true) {
        query = query.replace(
          'WHERE pl.status = \'available\'',
          'WHERE (pl.status = \'available\' OR pl.verification_status = \'pending\')'
        );
      }

      if (grade) {
        query += ` AND pl.grade = $${values.length + 1}`;
        values.push(grade);
      }

      if (cropType) {
        query += ` AND c.crop_type = $${values.length + 1}`;
        values.push(cropType);
      }

      query += ` GROUP BY c.crop_type, pl.grade, pl.verification_status`;

      if (minQuantity) {
        query += ` HAVING SUM(pl.quantity) >= $${values.length + 1}`;
        values.push(minQuantity);
      }

      query += ` ORDER BY c.crop_type, pl.grade, pl.verification_status DESC`;

      const result = await pool.query(query, values);

      // Separate verified and pending listings
      const verifiedListings = result.rows.filter(l => l.verification_status === 'available' || !l.verification_status);
      const pendingListings = result.rows.filter(l => l.verification_status === 'pending');

      console.log(`📊 [MARKETPLACE] Returning ${verifiedListings.length} verified + ${pendingListings.length} pending listings`);

      res.json({
        success: true,
        listings: {
          verified: verifiedListings,
          pending: pendingListings
        },
        summary: {
          total_verified: verifiedListings.length,
          total_pending: pendingListings.length,
          total: result.rows.length
        },
        pagination: { page: parseInt(page), limit: parseInt(limit), total: result.rows.length }
      });
    } catch (error) {
      console.error('❌ [MARKETPLACE] Error:', error.message);
      next(error);
    }
  }

  /**
   * Get product listing details with certificates
   */
  async getListingDetails(req, res, next) {
    try {
      const { listingId } = req.params;

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
          ic.id as image_cert_id,
          ic.overall_quality_score as image_quality,
          ic.spoilage_percentage,
          ic.freshness_score,
          ic.color_texture_score,
          iot.id as iot_cert_id,
          iot.environmental_quality_score as iot_quality,
          iot.temperature,
          iot.humidity,
          iot.mq2_value,
          iot.mq4_value,
          iot.mq6_value,
          iot.mq135_value
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

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Listing not found' });
      }

      res.json({
        success: true,
        listing: result.rows[0]
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Buy product (create transaction)
   */
  async buyProduct(req, res, next) {
    try {
      const { productListingId, quantity } = req.body;
      const buyerId = req.user.id;

      // Get listing details
      const listingQuery = `
        SELECT pl.*, c.crop_type, f.farmer_id, fp.id as fpo_id, gr.final_grade
        FROM product_listings pl
        JOIN crops c ON pl.crop_id = c.id
        JOIN farmers f ON c.farmer_id = f.id
        JOIN fpos fp ON pl.fpo_id = fp.id
        JOIN grading_results gr ON pl.grading_result_id = gr.id
        WHERE pl.id = $1
      `;

      const listingResult = await pool.query(listingQuery, [productListingId]);

      if (listingResult.rows.length === 0) {
        return res.status(404).json({ error: 'Listing not found' });
      }

      const listing = listingResult.rows[0];

      if (listing.quantity < quantity) {
        return res.status(400).json({ error: 'Insufficient quantity' });
      }

      // Get market price
      const marketPrice = await MarketPriceService.getMarketPrice(listing.crop_type, listing.final_grade);
      const pricePerUnit = MarketPriceService.calculatePrice(marketPrice.basePrice || 100, listing.final_grade);

      // Create transaction
      const transaction = await TransactionService.createTransaction({
        productListingId,
        buyerId,
        fpoId: listing.fpo_id,
        farmerId: listing.farmer_id,
        quantitySold: quantity,
        pricePerUnit,
        grade: listing.final_grade
      });

      // Update listing quantity
      const updateQuery = `
        UPDATE product_listings 
        SET quantity = quantity - $2, 
            status = CASE WHEN quantity - $2 <= 0 THEN 'sold'::listing_status_enum ELSE 'available'::listing_status_enum END,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `;

      await pool.query(updateQuery, [productListingId, quantity]);

      res.status(201).json({
        success: true,
        transaction,
        priceDetails: {
          unitPrice: pricePerUnit,
          totalPrice: pricePerUnit * quantity
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get buyer's transaction history
   */
  async getTransactionHistory(req, res, next) {
    try {
      const history = await TransactionService.getBuyerTransactionHistory(req.user.id);

      res.json({
        success: true,
        transactions: history
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get transparency report for purchased product
   */
  async getTransparencyReport(req, res, next) {
    try {
      const { transactionId } = req.params;

      const traceability = await TransactionService.getTransactionTraceability(transactionId);

      res.json({
        success: true,
        transparency: traceability
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new BuyerController();
