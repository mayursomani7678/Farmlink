const express = require('express');
const router = express.Router();
const PaymentController = require('../controllers/PaymentController');
const AdvancePaymentController = require('../controllers/AdvancePaymentController');
const FPOVerificationController = require('../controllers/FPOVerificationController');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

const paymentController = new PaymentController();

// All payment routes require authentication
router.use(authMiddleware);

// Buyer wallet
router.get('/wallet', (req, res, next) => paymentController.getBuyerWallet(req, res, next));

// Purchases
router.post('/purchases', (req, res, next) => paymentController.createPurchase(req, res, next));
router.get('/purchases', (req, res, next) => paymentController.getBuyerPurchases(req, res, next));
router.patch('/purchases/:purchaseId/received', (req, res, next) => paymentController.markPurchaseReceived(req, res, next));

// Advance payments for pending verification listings
router.post('/advance-payment', roleMiddleware(['buyer']), (req, res, next) => 
  AdvancePaymentController.payAdvance(req, res, next)
);
router.get('/pending-payments', roleMiddleware(['buyer']), (req, res, next) => 
  AdvancePaymentController.getPendingPayments(req, res, next)
);
router.post('/complete-payment/:purchaseId', roleMiddleware(['buyer']), (req, res, next) => 
  AdvancePaymentController.completePendingPayment(req, res, next)
);

// FPO verification endpoints
router.get('/verification/pending', roleMiddleware(['fpo']), (req, res, next) => 
  FPOVerificationController.getPendingVerification(req, res, next)
);
router.patch('/verification/:listingId/verify', roleMiddleware(['fpo']), (req, res, next) => 
  FPOVerificationController.verifyCrop(req, res, next)
);
router.patch('/verification/:listingId/reject', roleMiddleware(['fpo']), (req, res, next) => 
  FPOVerificationController.rejectListing(req, res, next)
);

// Farmer payments (FPO only)
router.get('/payments/farmer/:farmerId', (req, res, next) => paymentController.getFarmerPayments(req, res, next));
router.patch('/payments/:paymentId/given', (req, res, next) => paymentController.markPaymentAsGiven(req, res, next));

module.exports = router;
