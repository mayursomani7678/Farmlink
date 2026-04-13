const MandiPriceService = require('../services/MandiPriceService');

class MandiPriceController {
  /**
   * Get all mandi prices
   */
  async getAllPrices(req, res, next) {
    try {
      const prices = await MandiPriceService.getAllPrices();
      
      res.json({
        success: true,
        count: prices.length,
        prices
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get prices by commodity
   */
  async getPricesByCommodity(req, res, next) {
    try {
      const { commodity } = req.params;

      if (!commodity) {
        return res.status(400).json({ error: 'Commodity name required' });
      }

      const prices = await MandiPriceService.getPricesByCommodity(commodity);

      res.json({
        success: true,
        commodity,
        count: prices.length,
        prices
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get prices by location
   */
  async getPricesByLocation(req, res, next) {
    try {
      const { state, mandi } = req.query;

      if (!state) {
        return res.status(400).json({ error: 'State parameter required' });
      }

      const prices = await MandiPriceService.getPricesByLocation(state, mandi);

      res.json({
        success: true,
        state,
        mandi: mandi || 'all',
        count: prices.length,
        prices
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get average prices across all mandis
   */
  async getAveragePrices(req, res, next) {
    try {
      const prices = await MandiPriceService.getAveragePrices();

      res.json({
        success: true,
        count: prices.length,
        prices
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get price trends
   */
  async getPriceTrends(req, res, next) {
    try {
      const { commodity, days = 7 } = req.query;

      if (!commodity) {
        return res.status(400).json({ error: 'Commodity name required' });
      }

      const trends = await MandiPriceService.getPriceTrends(commodity, days);

      res.json({
        success: true,
        commodity,
        days,
        count: trends.length,
        trends
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get available commodities
   */
  async getCommodities(req, res, next) {
    try {
      const commodities = await MandiPriceService.getCommodities();

      res.json({
        success: true,
        count: commodities.length,
        commodities
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get available mandis
   */
  async getMandis(req, res, next) {
    try {
      const mandis = await MandiPriceService.getMandis();

      res.json({
        success: true,
        count: mandis.length,
        mandis
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new MandiPriceController();
