const pool = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class AdvancePaymentController {
  /**
   * Pay advance for pending verification listing
   * Minimum 10% of total price, buyer can choose more
   */
  async payAdvance(req, res, next) {
    try {
      const { listingId, advanceAmount, cropType, grade } = req.body;
      const userId = req.user.id;

      // Validation
      if (!listingId && (!cropType || !grade)) {
        return res.status(400).json({
          error: 'Either listingId or (cropType + grade) must be provided'
        });
      }

      if (!advanceAmount || advanceAmount <= 0) {
        return res.status(400).json({
          error: 'Advance amount must be greater than 0'
        });
      }

      // Get buyer_id from user_id
      let buyerResult = await pool.query(
        'SELECT id FROM buyers WHERE user_id = $1',
        [userId]
      );

      if (buyerResult.rows.length === 0) {
        return res.status(404).json({ error: 'Buyer profile not found' });
      }

      const buyerId = buyerResult.rows[0].id;

      // Get listing details
      let listing;
      if (listingId) {
        const listingResult = await pool.query(
          `SELECT pl.id, pl.price_per_kg, pl.quantity, c.crop_type, c.variety as grade,
                  pl.verification_status, f.farmer_name, fpo.organization_name
           FROM product_listings pl
           LEFT JOIN crops c ON pl.crop_id = c.id
           LEFT JOIN farmers f ON c.farmer_id = f.id
           LEFT JOIN fpos fpo ON pl.fpo_id = fpo.id
           WHERE pl.id = $1`,
          [listingId]
        );
        if (listingResult.rows.length === 0) {
          return res.status(404).json({ error: 'Listing not found' });
        }
        listing = listingResult.rows[0];
      } else {
        // Find first available listing with crop_type and grade
        const listingResult = await pool.query(
          `SELECT pl.id, pl.price_per_kg, pl.quantity, c.crop_type, c.variety as grade,
                  pl.verification_status, f.farmer_name, fpo.organization_name
           FROM product_listings pl
           LEFT JOIN crops c ON pl.crop_id = c.id
           LEFT JOIN farmers f ON c.farmer_id = f.id
           LEFT JOIN fpos fpo ON pl.fpo_id = fpo.id
           WHERE c.crop_type = $1 AND c.variety = $2 
           AND pl.verification_status = 'pending'
           LIMIT 1`,
          [cropType, grade]
        );
        if (listingResult.rows.length === 0) {
          return res.status(404).json({
            error: `No pending listings found for ${cropType} ${grade}`
          });
        }
        listing = listingResult.rows[0];
      }

      // Check if listing is pending verification
      if (listing.verification_status !== 'pending') {
        return res.status(400).json({
          error: `Listing is not pending verification. Current status: ${listing.verification_status}`
        });
      }

      // Calculate minimum advance (10% of total price for 1kg)
      const totalPrice = listing.price_per_kg;
      const minAdvance = totalPrice * 0.1;

      if (advanceAmount < minAdvance) {
        return res.status(400).json({
          error: `Advance must be at least ₹${minAdvance.toFixed(2)} (10% of ₹${totalPrice})`,
          min_advance: minAdvance
        });
      }

      // Check wallet balance
      const walletResult = await pool.query(
        'SELECT balance FROM buyer_wallets WHERE buyer_id = $1',
        [buyerId]
      );

      if (walletResult.rows.length === 0) {
        return res.status(400).json({ error: 'Wallet not found' });
      }

      const balance = walletResult.rows[0].balance;
      if (balance < advanceAmount) {
        return res.status(400).json({
          error: 'Insufficient balance',
          required: advanceAmount,
          available: balance
        });
      }

      // Create purchase with advance payment
      const purchaseId = uuidv4();
      const remainingToPay = totalPrice - advanceAmount;

      const purchaseQuery = `
        INSERT INTO purchases (
          id, buyer_id, listing_id, quantity, price_per_kg, 
          total_amount, advance_paid, remaining_to_pay, 
          payment_stage, status, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP)
        RETURNING id, advance_paid, remaining_to_pay, price_per_kg
      `;

      const purchaseResult = await pool.query(purchaseQuery, [
        purchaseId,
        buyerId,
        listing.id,
        1, // 1kg for now - advance is per kg
        listing.price_per_kg,
        listing.price_per_kg,
        advanceAmount,
        remainingToPay,
        'advance_paid',
        'pending_verification'
      ]);

      // Deduct from wallet
      const updateWalletQuery = `
        UPDATE buyer_wallets
        SET balance = balance - $1, total_spent = total_spent + $1
        WHERE buyer_id = $2
      `;
      await pool.query(updateWalletQuery, [advanceAmount, buyerId]);

      console.log(
        `💳 [ADVANCE] Buyer ${buyerId} paid ₹${advanceAmount} advance for ${listing.crop_type} ${listing.grade}`
      );

      res.status(201).json({
        success: true,
        purchase: purchaseResult.rows[0],
        message: `Advance payment of ₹${advanceAmount} registered. Remaining: ₹${remainingToPay.toFixed(2)}`,
        listing: {
          id: listing.id,
          crop_type: listing.crop_type,
          grade: listing.grade,
          farmer: listing.farmer_name,
          fpo: listing.organization_name
        }
      });
    } catch (error) {
      console.error('❌ [ADVANCE] Error:', error.message);
      res.status(500).json({
        error: 'Failed to process advance payment',
        details: error.message
      });
    }
  }

  /**
   * Get pending payments for buyer
   */
  async getPendingPayments(req, res, next) {
    try {
      const userId = req.user.id;

      // Get buyer_id
      const buyerResult = await pool.query(
        'SELECT id FROM buyers WHERE user_id = $1',
        [userId]
      );

      if (buyerResult.rows.length === 0) {
        return res.status(404).json({ error: 'Buyer not found' });
      }

      const buyerId = buyerResult.rows[0].id;

      // Get all pending payments
      const query = `
        SELECT 
          p.id,
          p.listing_id,
          p.advance_paid,
          p.remaining_to_pay,
          p.total_amount,
          p.price_per_kg,
          p.status,
          p.created_at,
          c.crop_type,
          c.variety as grade,
          f.farmer_name,
          fpo.organization_name,
          pl.verification_status
        FROM purchases p
        LEFT JOIN product_listings pl ON p.listing_id = pl.id
        LEFT JOIN crops c ON pl.crop_id = c.id
        LEFT JOIN farmers f ON c.farmer_id = f.id
        LEFT JOIN fpos fpo ON pl.fpo_id = fpo.id
        WHERE p.buyer_id = $1 
        AND p.payment_stage = 'advance_paid'
        ORDER BY p.created_at DESC
      `;

      const result = await pool.query(query, [buyerId]);

      res.json({
        success: true,
        pending_payments: result.rows,
        total_pending_amount: result.rows.reduce((sum, p) => sum + (p.remaining_to_pay || 0), 0)
      });
    } catch (error) {
      console.error('❌ [PENDING] Error:', error.message);
      res.status(500).json({
        error: 'Failed to fetch pending payments',
        details: error.message
      });
    }
  }

  /**
   * Complete pending payment after verification
   */
  async completePendingPayment(req, res, next) {
    try {
      const { purchaseId } = req.params;
      const userId = req.user.id;

      // Get buyer_id
      const buyerResult = await pool.query(
        'SELECT id FROM buyers WHERE user_id = $1',
        [userId]
      );

      if (buyerResult.rows.length === 0) {
        return res.status(404).json({ error: 'Buyer not found' });
      }

      const buyerId = buyerResult.rows[0].id;

      // Get purchase details
      const purchaseResult = await pool.query(
        `SELECT id, buyer_id, listing_id, remaining_to_pay, payment_stage, status
         FROM purchases WHERE id = $1`,
        [purchaseId]
      );

      if (purchaseResult.rows.length === 0) {
        return res.status(404).json({ error: 'Purchase not found' });
      }

      const purchase = purchaseResult.rows[0];

      // Verify buyer owns this purchase
      if (purchase.buyer_id !== buyerId) {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      // Verify purchase is pending
      if (purchase.payment_stage !== 'advance_paid') {
        return res.status(400).json({
          error: 'This purchase is not pending payment',
          current_stage: purchase.payment_stage
        });
      }

      // Check wallet balance
      const walletResult = await pool.query(
        'SELECT balance FROM buyer_wallets WHERE buyer_id = $1',
        [buyerId]
      );

      const balance = walletResult.rows[0].balance;
      const remainingAmount = purchase.remaining_to_pay;

      if (balance < remainingAmount) {
        return res.status(400).json({
          error: 'Insufficient balance for remaining payment',
          required: remainingAmount,
          available: balance
        });
      }

      // Update purchase to full payment
      const updatePurchaseQuery = `
        UPDATE purchases
        SET payment_stage = 'full_paid', 
            status = 'confirmed',
            advance_paid = advance_paid + $1,
            remaining_to_pay = 0,
            verified_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `;
      await pool.query(updatePurchaseQuery, [remainingAmount, purchaseId]);

      // Deduct from wallet
      const updateWalletQuery = `
        UPDATE buyer_wallets
        SET balance = balance - $1, total_spent = total_spent + $1
        WHERE buyer_id = $2
      `;
      await pool.query(updateWalletQuery, [remainingAmount, buyerId]);

      console.log(
        `💳 [COMPLETE] Buyer ${buyerId} completed payment of ₹${remainingAmount}`
      );

      res.json({
        success: true,
        message: 'Payment completed successfully',
        purchase: {
          id: purchaseId,
          status: 'confirmed',
          total_paid: purchase.advance_paid + purchase.remaining_to_pay
        }
      });
    } catch (error) {
      console.error('❌ [COMPLETE] Error:', error.message);
      res.status(500).json({
        error: 'Failed to complete payment',
        details: error.message
      });
    }
  }
}

module.exports = new AdvancePaymentController();
