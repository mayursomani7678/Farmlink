const express = require('express');
const router = express.Router();
const IoTController = require('../controllers/IoTController');

// Device Registration & Management
router.post('/devices', IoTController.registerDevice);
router.get('/devices/:deviceId', IoTController.getDevice);
router.delete('/devices/:deviceId', IoTController.deleteDevice);

// Get all devices for a crop
router.get('/crop/:cropId/devices', IoTController.getCropDevices);

// Submit sensor readings
// Single reading: POST /api/iot/readings/:deviceId
router.post('/readings/:deviceId', IoTController.submitReading);

// Batch submit: POST /api/iot/readings/:deviceId/batch
router.post('/readings/:deviceId/batch', IoTController.batchSubmitReadings);

// Generate random sample data for crop listing: GET /api/iot/sample-data?numReadings=12
router.get('/sample-data', IoTController.generateSampleData);

// Get sensor readings
// Latest readings: GET /api/iot/readings/:deviceId/latest?limit=10
router.get('/readings/:deviceId/latest', IoTController.getLatestReadings);

// Historical readings: GET /api/iot/readings/:deviceId/history?hoursBack=24&limit=100
router.get('/readings/:deviceId/history', IoTController.getDeviceHistory);

// Stream readings: GET /api/iot/readings/:deviceId/stream?sinceTimestamp=1234567890
router.get('/readings/:deviceId/stream', IoTController.streamReadings);

// Average readings: GET /api/iot/readings/:deviceId/average?minutesBack=60
router.get('/readings/:deviceId/average', IoTController.getAverageReadings);

module.exports = router;
