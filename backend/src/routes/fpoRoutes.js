const express = require('express');
const router = express.Router();
const FPOController = require('../controllers/FPOController');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const { uploadImage, uploadCSV } = require('../middleware/fileUpload');

// All FPO routes require authentication and FPO role
router.use(authMiddleware, roleMiddleware(['fpo']));

// Dashboard
router.get('/dashboard', (req, res, next) => FPOController.getDashboard(req, res, next));

// Farmer management
router.post('/farmers', (req, res, next) => FPOController.createFarmer(req, res, next));
router.get('/farmers', (req, res, next) => FPOController.getFarmers(req, res, next));

// Crop management
router.post('/crops', (req, res, next) => FPOController.createCrop(req, res, next));
router.get('/crops', (req, res, next) => FPOController.getCropsByFPO(req, res, next));

// IoT Data
router.get('/crops/:cropId/iot-data', (req, res, next) => FPOController.getIoTDataForCrop(req, res, next));
router.get('/crops/:cropId/iot-certificate', (req, res, next) => FPOController.getIoTCertificateForCrop(req, res, next));

// Quality Certification
router.post('/analyze-image', uploadImage, (req, res, next) => FPOController.analyzeGrapeImage(req, res, next));
router.post('/upload-iot-certificate', uploadCSV, (req, res, next) => FPOController.uploadIoTCertificate(req, res, next));
router.post('/create-iot-certificate', (req, res, next) => FPOController.createManualIoTCertificate(req, res, next));

// Grading
router.post('/generate-grade', (req, res, next) => FPOController.generateGrade(req, res, next));

// Product Listings
router.post('/listings', (req, res, next) => FPOController.createListing(req, res, next));
router.get('/farmers/:farmerId/listings', (req, res, next) => FPOController.getListingsForFarmer(req, res, next));

// Farmer Payments
router.get('/payments', (req, res, next) => FPOController.getFarmerPayments(req, res, next));
router.post('/payments', (req, res, next) => FPOController.createFarmerPayment(req, res, next));
router.put('/payments/:paymentId', (req, res, next) => FPOController.updatePaymentStatus(req, res, next));
router.patch('/payments/:paymentId/paid', (req, res, next) => FPOController.markPaymentGiven(req, res, next));

module.exports = router;
