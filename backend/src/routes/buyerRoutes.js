const express = require('express');
const router = express.Router();
const BuyerController = require('../controllers/BuyerController');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

// Public marketplace endpoints (no auth required)
router.get('/marketplace', (req, res, next) => BuyerController.getMarketplace(req, res, next));
router.get('/listings/:listingId', (req, res, next) => BuyerController.getListingDetails(req, res, next));

// Protected buyer endpoints
router.post('/buy', authMiddleware, roleMiddleware(['buyer']), (req, res, next) => BuyerController.buyProduct(req, res, next));
router.get('/transactions', authMiddleware, roleMiddleware(['buyer']), (req, res, next) => BuyerController.getTransactionHistory(req, res, next));
router.get('/transparency/:transactionId', authMiddleware, roleMiddleware(['buyer']), (req, res, next) => BuyerController.getTransparencyReport(req, res, next));

module.exports = router;
