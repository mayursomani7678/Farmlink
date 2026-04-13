const pool = require('../config/database');

class MandiPriceService {
  /**
   * Get live mandi prices for all commodities
   */
  static async getAllPrices() {
    try {
      const query = `
        SELECT 
          id,
          crop_name as commodity_name,
          grade,
          mandi_name,
          state,
          price_per_kg as price_per_unit,
          updated_at as timestamp
        FROM mandi_prices
        ORDER BY crop_name, mandi_name, updated_at DESC
      `;

      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      console.error('❌ [MANDI] Error fetching all prices:', error.message);
      throw error;
    }
  }

  /**
   * Get mandi prices for a specific commodity
   */
  static async getPricesByCommodity(commodityName) {
    try {
      const query = `
        SELECT 
          id,
          crop_name as commodity_name,
          grade,
          mandi_name,
          state,
          price_per_kg as price_per_unit,
          updated_at as timestamp
        FROM mandi_prices
        WHERE crop_name ILIKE $1
        ORDER BY updated_at DESC, mandi_name
      `;

      const result = await pool.query(query, [`%${commodityName}%`]);
      return result.rows;
    } catch (error) {
      console.error('❌ [MANDI] Error fetching prices by commodity:', error.message);
      throw error;
    }
  }

  /**
   * Get mandi prices for a specific state/mandi
   */
  static async getPricesByLocation(state, mandiName = null) {
    try {
      let query = `
        SELECT 
          id,
          crop_name as commodity_name,
          grade,
          mandi_name,
          state,
          price_per_kg as price_per_unit,
          updated_at as timestamp
        FROM mandi_prices
        WHERE state ILIKE $1
      `;
      
      const params = [`%${state}%`];

      if (mandiName) {
        query += ` AND mandi_name ILIKE $2`;
        params.push(`%${mandiName}%`);
      }

      query += ` ORDER BY updated_at DESC`;

      const result = await pool.query(query, params);
      return result.rows;
    } catch (error) {
      console.error('❌ [MANDI] Error fetching prices by location:', error.message);
      throw error;
    }
  }

  /**
   * Get average prices across all mandis for comparison
   */
  static async getAveragePrices() {
    try {
      const query = `
        SELECT 
          crop_name as commodity_name,
          grade,
          ROUND(AVG(price_per_kg)::numeric, 2) as avg_price,
          MIN(price_per_kg) as min_price,
          MAX(price_per_kg) as max_price,
          COUNT(DISTINCT mandi_name) as mandis_count,
          MAX(updated_at) as latest_timestamp
        FROM mandi_prices
        GROUP BY crop_name, grade
        ORDER BY crop_name, grade
      `;

      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      console.error('❌ [MANDI] Error fetching average prices:', error.message);
      throw error;
    }
  }

  /**
   * Get price trends for a commodity
   */
  static async getPriceTrends(commodityName, days = 7) {
    try {
      const query = `
        SELECT 
          DATE(updated_at) as date,
          crop_name as commodity_name,
          grade,
          ROUND(AVG(price_per_kg)::numeric, 2) as avg_price,
          MIN(price_per_kg) as min_price,
          MAX(price_per_kg) as max_price,
          COUNT(DISTINCT mandi_name) as mandis
        FROM mandi_prices
        WHERE crop_name ILIKE $1
        GROUP BY DATE(updated_at), crop_name, grade
        ORDER BY DATE(updated_at) DESC
      `;

      const result = await pool.query(query, [`%${commodityName}%`]);
      return result.rows;
    } catch (error) {
      console.error('❌ [MANDI] Error fetching price trends:', error.message);
      throw error;
    }
  }

  /**
   * Get distinct commodities available
   */
  static async getCommodities() {
    try {
      const query = `
        SELECT DISTINCT 
          crop_name as commodity_name,
          grade
        FROM mandi_prices
        ORDER BY crop_name, grade
      `;

      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      console.error('❌ [MANDI] Error fetching commodities:', error.message);
      throw error;
    }
  }

  /**
   * Get distinct mandis
   */
  static async getMandis() {
    try {
      const query = `
        SELECT DISTINCT 
          mandi_name,
          state,
          COUNT(DISTINCT crop_name) as commodities_count
        FROM mandi_prices
        GROUP BY mandi_name, state
        ORDER BY state, mandi_name
      `;

      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      console.error('❌ [MANDI] Error fetching mandis:', error.message);
      throw error;
    }
  }

  /**
   * Insert or update mandi price
   */
  static async upsertPrice(priceData) {
    try {
      const {
        commodity_name,
        variety,
        mandi_name,
        state,
        price_per_unit,
        currency = 'INR',
        unit = 'kg',
        min_price,
        max_price,
        avg_price,
        grade = 'A',
        supply_status = 'normal'
      } = priceData;

      const query = `
        INSERT INTO mandi_prices 
        (commodity_name, variety, mandi_name, state, price_per_unit, currency, unit, min_price, max_price, avg_price, grade, supply_status, timestamp)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
        RETURNING *
      `;

      const result = await pool.query(query, [
        commodity_name,
        variety,
        mandi_name,
        state,
        price_per_unit,
        currency,
        unit,
        min_price || price_per_unit,
        max_price || price_per_unit,
        avg_price || price_per_unit,
        grade,
        supply_status
      ]);

      console.log(`✅ [MANDI] Price updated for ${commodity_name} at ${mandi_name}`);
      return result.rows[0];
    } catch (error) {
      console.error('❌ [MANDI] Error upserting price:', error.message);
      throw error;
    }
  }
}

module.exports = MandiPriceService;
