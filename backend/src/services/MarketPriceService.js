const pool = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class MarketPriceService {
  /**
   * Get current market price for a crop and grade
   */
  async getMarketPrice(cropType, grade) {
    const query = `
      SELECT * FROM market_prices 
      WHERE crop_type = $1 AND grade = $2
      ORDER BY updated_at DESC 
      LIMIT 1
    `;

    const result = await pool.query(query, [cropType, grade]);
    
    if (result.rows.length === 0) {
      // Return default price if not found
      return this._getDefaultPrice(grade);
    }

    return result.rows[0];
  }

  /**
   * Calculate price for product based on grade
   */
  calculatePrice(basePrice, grade) {
    const multipliers = {
      'A': 1.0,
      'B': 0.8,
      'C': 0.6
    };

    const multiplier = multipliers[grade] || 0.6;
    return parseFloat((basePrice * multiplier).toFixed(2));
  }

  /**
   * Update market prices from external API
   */
  async updateMarketPricesFromAPI() {
    try {
      // This would integrate with mandi API or market data providers
      // For now, returning mock data
      const mockPrices = [
        { cropType: 'grapes', grade: 'A', basePrice: 100 },
        { cropType: 'grapes', grade: 'B', basePrice: 80 },
        { cropType: 'grapes', grade: 'C', basePrice: 60 }
      ];

      for (const price of mockPrices) {
        await this._upsertMarketPrice(price);
      }

      return { success: true, updatedPrices: mockPrices.length };
    } catch (error) {
      console.error('Failed to update market prices:', error);
      throw error;
    }
  }

  /**
   * Upsert market price
   * @private
   */
  async _upsertMarketPrice(priceData) {
    const { cropType, grade, basePrice } = priceData;
    const id = uuidv4();

    const query = `
      INSERT INTO market_prices (id, crop_type, grade, base_price)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (crop_type, grade) DO UPDATE
      SET base_price = $4, updated_at = CURRENT_TIMESTAMP
      RETURNING *;
    `;

    const values = [id, cropType, grade, basePrice];
    await pool.query(query, values);
  }

  /**
   * Get default price for grade
   * @private
   */
  _getDefaultPrice(grade) {
    const defaultPrices = {
      'A': 100,
      'B': 80,
      'C': 60
    };

    return {
      basePrice: defaultPrices[grade] || 60,
      grade
    };
  }

  /**
   * Get price history for transparency
   */
  async getPriceHistory(farmerId, limit = 50) {
    const query = `
      SELECT * FROM price_history 
      WHERE farmer_id = $1 
      ORDER BY recorded_at DESC 
      LIMIT $2
    `;

    const result = await pool.query(query, [farmerId, limit]);
    return result.rows;
  }

  /**
   * Record transaction price for transparency
   */
  async recordPriceHistory(transactionData) {
    const {
      transactionId,
      farmerId,
      cropType,
      grade,
      priceReceived,
      marketPriceAtTime
    } = transactionData;

    const id = uuidv4();
    const fpoMargin = marketPriceAtTime - priceReceived;
    const transparencyScore = priceReceived >= (marketPriceAtTime * 0.85) ? 1.0 : 0.7;

    const query = `
      INSERT INTO price_history 
      (id, transaction_id, farmer_id, crop_type, grade, price_received, market_price_at_time, fpo_margin, transparency_score)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *;
    `;

    const values = [
      id, transactionId, farmerId, cropType, grade,
      priceReceived, marketPriceAtTime, fpoMargin, transparencyScore
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }
}

module.exports = new MarketPriceService();
