const express = require('express');
const router = express.Router();
const MandiPriceController = require('../controllers/MandiPriceController');

// Public routes - mandi prices are available to everyone
router.get('/all', (req, res, next) => MandiPriceController.getAllPrices(req, res, next));
router.get('/commodity/:commodity', (req, res, next) => MandiPriceController.getPricesByCommodity(req, res, next));
router.get('/location', (req, res, next) => MandiPriceController.getPricesByLocation(req, res, next));
router.get('/average', (req, res, next) => MandiPriceController.getAveragePrices(req, res, next));
router.get('/trends', (req, res, next) => MandiPriceController.getPriceTrends(req, res, next));
router.get('/commodities', (req, res, next) => MandiPriceController.getCommodities(req, res, next));
router.get('/mandis', (req, res, next) => MandiPriceController.getMandis(req, res, next));

module.exports = router;
