const pool = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class PaymentController {
  /**
   * Get buyer wallet
   */
  async getBuyerWallet(req, res, next) {
    try {
      const userId = req.user.id;

      // Get buyer_id from user_id
      let buyerResult = await pool.query('SELECT id FROM buyers WHERE user_id = $1', [userId]);

      let buyerId;
      if (buyerResult.rows.length === 0) {
        // Auto-create buyer profile if it doesn't exist
        buyerId = uuidv4();
        try {
          await pool.query(
            'INSERT INTO buyers (id, user_id, company_name, industry_type) VALUES ($1, $2, $3, $4)',
            [buyerId, userId, 'Buyer', 'retailer']
          );
          console.log('✅ [WALLET] Created buyer profile:', buyerId);
        } catch (err) {
          return res.status(400).json({ error: 'Failed to create buyer profile' });
        }
      } else {
        buyerId = buyerResult.rows[0].id;
      }

      let walletResult = await pool.query('SELECT * FROM buyer_wallets WHERE buyer_id = $1', [buyerId]);

      if (walletResult.rows.length === 0) {
        // Create wallet with initial balance if it doesn't exist
        try {
          await pool.query(
            'INSERT INTO buyer_wallets (buyer_id, balance, total_spent) VALUES ($1, 100000, 0)',
            [buyerId]
          );
          walletResult = await pool.query('SELECT id, buyer_id, balance, total_spent, created_at, updated_at FROM buyer_wallets WHERE buyer_id = $1', [buyerId]);
          console.log('✅ [WALLET] Created wallet with ₹100,000 for buyer:', buyerId);
        } catch (err) {
          return res.status(400).json({ error: 'Failed to create wallet' });
        }
      }

      res.json({
        success: true,
        wallet: walletResult.rows[0]
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create purchase
   */
  async createPurchase(req, res, next) {
    try {
      const userId = req.user.id;
      const { listingId, cropType, grade, quantity } = req.body;

      if (!quantity || quantity <= 0) {
        return res.status(400).json({ error: 'Valid quantity required' });
      }

      if (!listingId && (!cropType || !grade)) {
        return res.status(400).json({ error: 'Either listingId or (cropType + grade) required' });
      }

      // Get buyer_id from user_id
      let buyerResult = await pool.query('SELECT id FROM buyers WHERE user_id = $1', [userId]);

      let buyerId;
      if (buyerResult.rows.length === 0) {
        // Auto-create buyer profile if it doesn't exist
        console.log('⚠️ [PURCHASE] Buyer profile not found, creating...');
        buyerId = uuidv4();
        try {
          await pool.query(
            'INSERT INTO buyers (id, user_id, company_name, industry_type) VALUES ($1, $2, $3, $4)',
            [buyerId, userId, 'Buyer', 'retailer']
          );
          console.log('✅ [PURCHASE] Created buyer profile:', buyerId);
        } catch (err) {
          console.error('❌ [PURCHASE] Error creating buyer profile:', err.message);
          return res.status(400).json({ error: 'Failed to create buyer profile' });
        }
      } else {
        buyerId = buyerResult.rows[0].id;
      }

      // Get listing details - if cropType and grade provided, find ALL available listings
      let selectedListingId = listingId;
      let listing;
      let listings = [];

      if (!selectedListingId && cropType && grade) {
        // Find ALL available listings with this crop type and grade (order by quantity DESC to prefer larger lots)
        const findListingsQuery = `
          SELECT 
            pl.id,
            pl.crop_id,
            pl.quantity as available_quantity,
            pl.grade,
            pl.fpo_id,
            c.crop_type,
            c.farmer_id
          FROM product_listings pl
          JOIN crops c ON pl.crop_id = c.id
          WHERE c.crop_type = $1 
            AND pl.grade = $2 
            AND pl.status = 'available'
            AND pl.quantity > 0
            AND pl.expires_at > CURRENT_TIMESTAMP
          ORDER BY pl.quantity DESC
        `;
        const findResult = await pool.query(findListingsQuery, [cropType, grade]);
        
        if (findResult.rows.length === 0) {
          return res.status(404).json({ error: `No available listings for ${cropType} Grade ${grade}` });
        }

        listings = findResult.rows;
        listing = listings[0]; // Use the largest listing
        selectedListingId = listing.id;
        
        // Calculate total available from all listings
        const totalAvailable = listings.reduce((sum, l) => sum + parseFloat(l.available_quantity), 0);
        
        console.log(`ℹ️ [PURCHASE] Found ${listings.length} listings for ${cropType} ${grade}. Total available: ${totalAvailable}kg`);
        console.log(`ℹ️ [PURCHASE] Using primary listing: ${selectedListingId} (${listing.available_quantity}kg)`);
      } else {
        // Use provided listingId
        const listingQuery = `
          SELECT 
            pl.id,
            pl.crop_id,
            pl.quantity as available_quantity,
            pl.grade,
            pl.fpo_id,
            c.crop_type,
            c.farmer_id
          FROM product_listings pl
          JOIN crops c ON pl.crop_id = c.id
          WHERE pl.id = $1
        `;
        const listingResult = await pool.query(listingQuery, [selectedListingId]);

        if (listingResult.rows.length === 0) {
          return res.status(404).json({ error: 'Listing not found' });
        }

        listing = listingResult.rows[0];
        listings = [listing];
      }

      // Calculate total available quantity across all listings
      const totalAvailableQty = listings.reduce((sum, l) => sum + parseFloat(l.available_quantity), 0);

      // Validate that requested quantity doesn't exceed total available quantity
      if (quantity > totalAvailableQty) {
        console.log(`❌ [PURCHASE] Insufficient quantity. Requested: ${quantity}kg, Total Available: ${totalAvailableQty}kg (${listings.length} listings)`);
        return res.status(400).json({ 
          error: `Cannot purchase more than available. Requested: ${quantity}kg, Total Available: ${totalAvailableQty}kg` 
        });
      }

      // Get mandi price by grade
      const priceQuery = `
        SELECT price_per_kg FROM mandi_prices
        WHERE crop_name ILIKE $1 AND grade = $2
        LIMIT 1
      `;
      const priceResult = await pool.query(priceQuery, [listing.crop_type || 'Grapes', listing.grade || 'A']);

      if (priceResult.rows.length === 0) {
        console.log('❌ [PURCHASE] No price found for:', listing.crop_type, listing.grade);
        return res.status(400).json({ error: 'Price not found for this crop and grade' });
      }

      const pricePerKg = parseFloat(priceResult.rows[0].price_per_kg);
      const totalAmount = quantity * pricePerKg;

      // Check if wallet exists, if not create it
      let walletResult = await pool.query('SELECT balance FROM buyer_wallets WHERE buyer_id = $1', [buyerId]);
      
      if (walletResult.rows.length === 0) {
        // Create wallet with initial balance if it doesn't exist
        console.log('⚠️ [PURCHASE] Wallet not found, creating with ₹100,000...');
        try {
          await pool.query(
            'INSERT INTO buyer_wallets (buyer_id, balance, total_spent) VALUES ($1, 100000, 0)',
            [buyerId]
          );
          console.log('✅ [PURCHASE] Created wallet for buyer:', buyerId);
          walletResult = await pool.query('SELECT balance FROM buyer_wallets WHERE buyer_id = $1', [buyerId]);
        } catch (err) {
          console.error('❌ [PURCHASE] Error creating wallet:', err.message);
          return res.status(400).json({ error: 'Failed to create wallet' });
        }
      }

      const currentBalance = parseFloat(walletResult.rows[0].balance);

      if (currentBalance < totalAmount) {
        return res.status(400).json({ 
          error: `Insufficient balance. Required: ₹${totalAmount}, Available: ₹${currentBalance}` 
        });
      }

      // Create purchase - cascade through listings if needed
      const purchaseId = uuidv4();
      let remainingQuantity = quantity;
      let listingIndex = 0;
      const purchasesCreated = [];

      console.log(`📦 [PURCHASE] Fulfilling ${quantity}kg from ${listings.length} available listings`);

      // Cascade through listings to fulfill the full quantity
      while (remainingQuantity > 0 && listingIndex < listings.length) {
        const currentListing = listings[listingIndex];
        const quantityFromThisListing = Math.min(remainingQuantity, currentListing.available_quantity);

        console.log(`📦 [PURCHASE] Listing ${listingIndex + 1}: Taking ${quantityFromThisListing}kg from listing ${currentListing.id}`);

        // Create purchase record for this listing
        const listingPurchaseId = uuidv4();
        const createPurchaseQuery = `
          INSERT INTO purchases 
          (id, buyer_id, listing_id, farm_id, fpo_id, quantity, price_per_kg, total_amount, status)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending')
          RETURNING *
        `;
        await pool.query(createPurchaseQuery, [
          listingPurchaseId, buyerId, currentListing.id, currentListing.farmer_id, currentListing.fpo_id, 
          quantityFromThisListing, pricePerKg, quantityFromThisListing * pricePerKg
        ]);

        purchasesCreated.push({
          id: listingPurchaseId,
          listingId: currentListing.id,
          quantity: quantityFromThisListing,
          amount: quantityFromThisListing * pricePerKg
        });

        // Decrease the product listing quantity
        const decreaseQuantityQuery = `
          UPDATE product_listings
          SET quantity = quantity - $1, 
              status = CASE WHEN quantity - $1 <= 0 THEN 'sold'::listing_status_enum ELSE 'available'::listing_status_enum END
          WHERE id = $2
        `;
        await pool.query(decreaseQuantityQuery, [quantityFromThisListing, currentListing.id]);

        remainingQuantity -= quantityFromThisListing;
        listingIndex++;
      }

      // Create single escrow for entire transaction
      const escrowId = uuidv4();
      const createEscrowQuery = `
        INSERT INTO escrow_accounts (id, transaction_id, amount, status)
        VALUES ($1, $2, $3, 'held')
      `;
      await pool.query(createEscrowQuery, [escrowId, purchaseId, totalAmount]);

      // Deduct from wallet once
      const updateWalletQuery = `
        UPDATE buyer_wallets
        SET balance = balance - $1, total_spent = total_spent + $1
        WHERE buyer_id = $2
      `;
      await pool.query(updateWalletQuery, [totalAmount, buyerId]);

      console.log(`💳 [PURCHASE] Created ${purchasesCreated.length} purchase record(s) for ₹${totalAmount}`);

      res.status(201).json({
        success: true,
        purchase: {
          id: purchaseId,
          quantity,
          pricePerKg,
          totalAmount,
          status: 'pending',
          purchasesCreated: purchasesCreated.length,
          details: `Fulfilled from ${purchasesCreated.length} listing(s)`
        }
      });
    } catch (error) {
      console.error('❌ [PURCHASE] Error:', error.message);
      console.error('❌ [PURCHASE] Stack:', error.stack);
      console.error('❌ [PURCHASE] Full Error:', JSON.stringify(error, null, 2));
      // Return detailed error to client
      return res.status(500).json({ 
        error: 'Failed to create purchase',
        details: error.message,
        code: error.code,
        type: error.type
      });
    }
  }

  /**
   * Get buyer purchases
   */
  async getBuyerPurchases(req, res, next) {
    try {
      const userId = req.user.id;

      // Get buyer_id from user_id
      let buyerResult = await pool.query('SELECT id FROM buyers WHERE user_id = $1', [userId]);

      let buyerId;
      if (buyerResult.rows.length === 0) {
        return res.json({
          success: true,
          purchases: []
        });
      }

      buyerId = buyerResult.rows[0].id;

      const query = `
        SELECT 
          p.id, p.buyer_id, p.listing_id, p.farm_id, p.fpo_id,
          p.quantity, p.price_per_kg, p.total_amount, p.status,
          p.received_at, p.created_at,
          f.farmer_name, fp.organization_name as fpo_name,
          pl.crop_id, pl.grade, c.crop_type
        FROM purchases p
        JOIN farmers f ON p.farm_id = f.id
        JOIN fpos fp ON p.fpo_id = fp.id
        JOIN product_listings pl ON p.listing_id = pl.id
        JOIN crops c ON pl.crop_id = c.id
        WHERE p.buyer_id = $1
        ORDER BY p.created_at DESC
      `;

      const result = await pool.query(query, [buyerId]);

      console.log(`✅ [GET_PURCHASES] Found ${result.rows.length} purchases for buyer:`, buyerId);

      res.json({
        success: true,
        purchases: result.rows
      });
    } catch (error) {
      console.error('❌ [GET_PURCHASES] Error:', error.message);
      next(error);
    }
  }

  /**
   * Mark purchase as received
   */
  async markPurchaseReceived(req, res, next) {
    try {
      const { purchaseId } = req.params;
      const userId = req.user.id;

      // Get buyer_id from user_id
      const buyerResult = await pool.query('SELECT id FROM buyers WHERE user_id = $1', [userId]);
      
      if (buyerResult.rows.length === 0) {
        return res.status(400).json({ error: 'Buyer profile not found' });
      }

      const buyerId = buyerResult.rows[0].id;

      // Get purchase with listing details
      const purchaseQuery = `
        SELECT p.*, 
               c.farmer_id, pl.fpo_id
        FROM purchases p
        JOIN product_listings pl ON p.listing_id = pl.id
        JOIN crops c ON pl.crop_id = c.id
        WHERE p.id = $1 AND p.buyer_id = $2
      `;
      const purchaseResult = await pool.query(purchaseQuery, [purchaseId, buyerId]);

      if (purchaseResult.rows.length === 0) {
        return res.status(404).json({ error: 'Purchase not found' });
      }

      const purchase = purchaseResult.rows[0];
      const farmerId = purchase.farmer_id;
      const fpoId = purchase.fpo_id;

      // Update purchase status to delivered
      const updateQuery = `
        UPDATE purchases
        SET status = 'delivered', received_at = NOW()
        WHERE id = $1
        RETURNING *
      `;
      const updatedResult = await pool.query(updateQuery, [purchaseId]);

      // Update escrow status to released
      const escrowQuery = `
        UPDATE escrow_accounts
        SET status = 'released', released_at = NOW()
        WHERE transaction_id = $1
      `;
      await pool.query(escrowQuery, [purchaseId]);

      // Create farmer payment record in farmer_payments table
      const paymentId = uuidv4();
      const paymentQuery = `
        INSERT INTO farmer_payments (id, fpo_id, farmer_id, purchase_id, amount, status, created_at)
        VALUES ($1, $2, $3, $4, $5, 'pending', CURRENT_TIMESTAMP)
      `;
      await pool.query(paymentQuery, [
        paymentId, fpoId, farmerId, purchaseId, purchase.total_amount
      ]);

      console.log(`📦 [DELIVERY] Purchase ${purchaseId} marked as delivered. Farmer payment created: ₹${purchase.total_amount}`);

      res.json({
        success: true,
        purchase: updatedResult.rows[0],
        message: 'Delivery marked. Farmer payment registered.'
      });
    } catch (error) {
      console.error('❌ [DELIVERY] Error:', error.message);
      next(error);
    }
  }

  /**
   * Get farmer payments (for FPO)
   */
  async getFarmerPayments(req, res, next) {
    try {
      const { farmerId } = req.params;

      const query = `
        SELECT 
          fp.id, fp.farmer_id, fp.fpo_id, fp.purchase_id, fp.amount,
          fp.status, fp.paid_at, fp.given_at, fp.given_by_fpo,
          fp.created_at,
          f.farmer_name, p.quantity, p.price_per_kg,
          b.email as buyer_email
        FROM farmer_payments fp
        JOIN farmers f ON fp.farmer_id = f.id
        JOIN purchases p ON fp.purchase_id = p.id
        JOIN buyers b ON p.buyer_id = b.id
        WHERE fp.farmer_id = $1
        ORDER BY fp.created_at DESC
      `;

      const result = await pool.query(query, [farmerId]);

      res.json({
        success: true,
        payments: result.rows
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mark payment as given (FPO confirms payment to farmer)
   */
  async markPaymentAsGiven(req, res, next) {
    try {
      const { paymentId } = req.params;

      // Get payment
      const paymentQuery = `
        SELECT * FROM farmer_payments WHERE id = $1
      `;
      const paymentResult = await pool.query(paymentQuery, [paymentId]);

      if (paymentResult.rows.length === 0) {
        return res.status(404).json({ error: 'Payment not found' });
      }

      const payment = paymentResult.rows[0];

      // Update payment status
      const updateQuery = `
        UPDATE farmer_payments
        SET status = 'paid', given_at = NOW(), given_by_fpo = TRUE
        WHERE id = $1
        RETURNING *
      `;
      const updatedResult = await pool.query(updateQuery, [paymentId]);

      // Release escrow to farmer account (future: integrate with bank)
      const escrowUpdateQuery = `
        UPDATE escrow_accounts
        SET status = 'released', released_at = NOW()
        WHERE transaction_id = $1
      `;
      await pool.query(escrowUpdateQuery, [payment.purchase_id]);

      console.log(`💰 [PAYMENT] Payment ${paymentId} marked as given to farmer ${payment.farmer_id}`);

      res.json({
        success: true,
        payment: updatedResult.rows[0]
      });
    } catch (error) {
      console.error('❌ [PAYMENT] Error:', error.message);
      next(error);
    }
  }
}

module.exports = PaymentController;
