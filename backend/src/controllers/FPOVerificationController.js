const pool = require('../config/database');

class FPOVerificationController {
  /**
   * Verify a crop listing after quality checks
   */
  async verifyCrop(req, res, next) {
    try {
      const { listingId } = req.params;
      const { notes } = req.body;
      const userId = req.user.id;

      // Get FPO from user
      const fpoResult = await pool.query(
        'SELECT id FROM fpos WHERE user_id = $1',
        [userId]
      );

      if (fpoResult.rows.length === 0) {
        return res.status(403).json({ error: 'Not authorized. FPO access required.' });
      }

      // Get listing details
      const listingResult = await pool.query(
        `SELECT pl.id, pl.fpo_id, pl.verification_status, pl.crop_id,
                c.crop_type, c.variety as grade, pl.price_per_kg
         FROM product_listings pl
         LEFT JOIN crops c ON pl.crop_id = c.id
         WHERE pl.id = $1`,
        [listingId]
      );

      if (listingResult.rows.length === 0) {
        return res.status(404).json({ error: 'Listing not found' });
      }

      const listing = listingResult.rows[0];

      // Verify FPO owns this listing
      if (listing.fpo_id && listing.fpo_id !== fpoResult.rows[0].id) {
        return res.status(403).json({ error: 'You do not own this listing' });
      }

      // Check current status
      if (listing.verification_status === 'verified') {
        return res.status(400).json({ error: 'Listing is already verified' });
      }

      if (listing.verification_status === 'rejected') {
        return res.status(400).json({ error: 'Listing has been rejected' });
      }

      // Update listing to verified
      const updateQuery = `
        UPDATE product_listings
        SET verification_status = 'verified'::verification_status_enum,
            verification_notes = $1,
            verified_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING id, verification_status, verified_at
      `;

      const updateResult = await pool.query(updateQuery, [notes || null, listingId]);

      // Get any pending purchases for this listing and notify buyers
      const purchasesResult = await pool.query(
        `SELECT p.id, p.buyer_id, p.advance_paid, p.remaining_to_pay
         FROM purchases p
         WHERE p.listing_id = $1 AND p.payment_stage = 'advance_paid'`,
        [listingId]
      );

      console.log(
        `✅ [VERIFY] Listing ${listingId} verified. ${purchasesResult.rows.length} buyers waiting for payment completion`
      );

      res.json({
        success: true,
        message: 'Listing verified successfully',
        listing: updateResult.rows[0],
        pending_buyers_count: purchasesResult.rows.length,
        notification: 'Buyers with advance payments have been notified to complete their payments'
      });
    } catch (error) {
      console.error('❌ [VERIFY] Error:', error.message);
      res.status(500).json({
        error: 'Failed to verify listing',
        details: error.message
      });
    }
  }

  /**
   * Get listings pending verification
   */
  async getPendingVerification(req, res, next) {
    try {
      const userId = req.user.id;

      // Get FPO
      const fpoResult = await pool.query(
        'SELECT id FROM fpos WHERE user_id = $1',
        [userId]
      );

      if (fpoResult.rows.length === 0) {
        return res.status(403).json({ error: 'FPO access required' });
      }

      const fpoId = fpoResult.rows[0].id;

      // Get pending listings
      const query = `
        SELECT 
          pl.id,
          pl.crop_id,
          c.crop_type,
          c.variety as grade,
          pl.price_per_kg,
          pl.quantity,
          pl.verification_status,
          pl.created_at,
          f.farmer_name,
          (SELECT COUNT(*) FROM purchases 
           WHERE listing_id = pl.id AND payment_stage = 'advance_paid') as advance_buyers_count,
          (SELECT SUM(advance_paid) FROM purchases 
           WHERE listing_id = pl.id AND payment_stage = 'advance_paid') as total_advances
        FROM product_listings pl
        LEFT JOIN crops c ON pl.crop_id = c.id
        LEFT JOIN farmers f ON c.farmer_id = f.id
        WHERE pl.fpo_id = $1 AND pl.verification_status = 'pending'
        ORDER BY pl.created_at ASC
      `;

      const result = await pool.query(query, [fpoId]);

      res.json({
        success: true,
        pending_listings: result.rows,
        total_pending: result.rows.length
      });
    } catch (error) {
      console.error('❌ [PENDING_VER] Error:', error.message);
      res.status(500).json({
        error: 'Failed to fetch pending verification',
        details: error.message
      });
    }
  }

  /**
   * Reject a listing with reason
   */
  async rejectListing(req, res, next) {
    try {
      const { listingId } = req.params;
      const { reason } = req.body;
      const userId = req.user.id;

      if (!reason) {
        return res.status(400).json({ error: 'Rejection reason is required' });
      }

      // Get FPO
      const fpoResult = await pool.query(
        'SELECT id FROM fpos WHERE user_id = $1',
        [userId]
      );

      if (fpoResult.rows.length === 0) {
        return res.status(403).json({ error: 'FPO access required' });
      }

      // Update listing status
      const updateQuery = `
        UPDATE product_listings
        SET verification_status = 'rejected'::verification_status_enum,
            verification_notes = $1
        WHERE id = $2 AND fpo_id = $3
        RETURNING id, verification_status
      `;

      const result = await pool.query(updateQuery, [reason, listingId, fpoResult.rows[0].id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Listing not found or not owned by this FPO' });
      }

      console.log(`❌ [REJECT] Listing ${listingId} rejected: ${reason}`);

      res.json({
        success: true,
        message: 'Listing rejected',
        listing: result.rows[0]
      });
    } catch (error) {
      console.error('❌ [REJECT] Error:', error.message);
      res.status(500).json({
        error: 'Failed to reject listing',
        details: error.message
      });
    }
  }
}

module.exports = new FPOVerificationController();
