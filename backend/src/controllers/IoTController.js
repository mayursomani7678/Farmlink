const IoTDeviceService = require('../services/IoTDeviceService');
const pool = require('../config/database');

class IoTController {
  // Register new IoT device for a crop
  static async registerDevice(req, res, next) {
    try {
      const { cropId, deviceName, deviceType, location } = req.body;

      if (!cropId || !deviceName) {
        return res.status(400).json({ error: 'cropId and deviceName are required' });
      }

      const device = await IoTDeviceService.registerDevice(
        cropId,
        deviceName,
        deviceType || 'environmental_sensor'
      );

      // Update device location if provided
      if (location) {
        const updateQuery = 'UPDATE iot_devices SET location = $1 WHERE id = $2 RETURNING *';
        const updateResult = await pool.query(updateQuery, [location, device.id]);
        return res.status(201).json({
          success: true,
          device: updateResult.rows[0],
          message: `Device registered successfully. Device ID: ${device.id}`
        });
      }

      res.status(201).json({
        success: true,
        device,
        message: `Device registered successfully. Device ID: ${device.id}`
      });
    } catch (error) {
      next(error);
    }
  }

  // Get device info
  static async getDevice(req, res, next) {
    try {
      const { deviceId } = req.params;

      const device = await IoTDeviceService.getDevice(deviceId);
      if (!device) {
        return res.status(404).json({ error: 'Device not found' });
      }

      res.json({
        success: true,
        device
      });
    } catch (error) {
      next(error);
    }
  }

  // Submit sensor reading
  static async submitReading(req, res, next) {
    try {
      const { deviceId } = req.params;
      const sensorData = req.body;

      if (!deviceId) {
        return res.status(400).json({ error: 'Device ID is required' });
      }

      // Validate required fields
      if (typeof sensorData !== 'object' || Object.keys(sensorData).length === 0) {
        return res.status(400).json({ error: 'Sensor data is required' });
      }

      const reading = await IoTDeviceService.ingestSensorReading(deviceId, sensorData);

      // Calculate quality score
      const qualityResult = IoTDeviceService.calculateQualityScore(reading);

      // Update device last reading time
      const updateQuery = 'UPDATE iot_devices SET last_reading_at = NOW() WHERE id = $1';
      await pool.query(updateQuery, [deviceId]);

      res.status(201).json({
        success: true,
        reading,
        quality: qualityResult,
        message: 'Sensor reading recorded successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // Get latest readings for device
  static async getLatestReadings(req, res, next) {
    try {
      const { deviceId } = req.params;
      const { limit = 10 } = req.query;

      const readings = await IoTDeviceService.getLatestReadings(deviceId, Math.min(limit, 100));

      res.json({
        success: true,
        readings,
        count: readings.length
      });
    } catch (error) {
      next(error);
    }
  }

  // Get average readings over time period
  static async getAverageReadings(req, res, next) {
    try {
      const { deviceId } = req.params;
      const { minutesBack = 60 } = req.query;

      const averages = await IoTDeviceService.getAverageReadings(deviceId, minutesBack);

      if (!averages) {
        return res.status(404).json({ error: 'No readings found' });
      }

      const qualityResult = IoTDeviceService.calculateQualityScore(averages);

      res.json({
        success: true,
        averages,
        quality: qualityResult,
        period_minutes: minutesBack
      });
    } catch (error) {
      next(error);
    }
  }

  // Get all devices for a crop
  static async getCropDevices(req, res, next) {
    try {
      const { cropId } = req.params;

      const devices = await IoTDeviceService.getCropDevices(cropId);

      res.json({
        success: true,
        devices,
        count: devices.length
      });
    } catch (error) {
      next(error);
    }
  }

  // Get device readings history
  static async getDeviceHistory(req, res, next) {
    try {
      const { deviceId } = req.params;
      const { hoursBack = 24, limit = 100 } = req.query;

      const query = `
        SELECT * FROM iot_sensor_readings
        WHERE device_id = $1
        AND received_at > NOW() - INTERVAL '${hoursBack} hours'
        ORDER BY received_at DESC
        LIMIT $2
      `;

      const result = await pool.query(query, [deviceId, Math.min(limit, 1000)]);

      res.json({
        success: true,
        readings: result.rows,
        count: result.rows.length,
        period_hours: hoursBack
      });
    } catch (error) {
      next(error);
    }
  }

  // Stream sensor readings (WebSocket-like endpoint for polling)
  static async streamReadings(req, res, next) {
    try {
      const { deviceId } = req.params;
      const { sinceTimestamp } = req.query;

      let query = 'SELECT * FROM iot_sensor_readings WHERE device_id = $1';
      const params = [deviceId];

      if (sinceTimestamp) {
        query += ` AND received_at > to_timestamp($2)`;
        params.push(sinceTimestamp);
      }

      query += ' ORDER BY received_at DESC LIMIT 50';

      const result = await pool.query(query, params);

      res.json({
        success: true,
        readings: result.rows,
        count: result.rows.length,
        latest_timestamp: result.rows.length > 0 ? result.rows[0].received_at : null
      });
    } catch (error) {
      next(error);
    }
  }

  // Delete device
  static async deleteDevice(req, res, next) {
    try {
      const { deviceId } = req.params;

      const device = await IoTDeviceService.deleteDevice(deviceId);

      if (!device) {
        return res.status(404).json({ error: 'Device not found' });
      }

      res.json({
        success: true,
        message: 'Device deleted successfully',
        device
      });
    } catch (error) {
      next(error);
    }
  }

  // Batch submit readings
  static async batchSubmitReadings(req, res, next) {
    try {
      const { deviceId } = req.params;
      const { readings } = req.body;

      if (!Array.isArray(readings) || readings.length === 0) {
        return res.status(400).json({ error: 'readings array is required' });
      }

      const results = [];
      for (const sensorData of readings) {
        const reading = await IoTDeviceService.ingestSensorReading(deviceId, sensorData);
        results.push(reading);
      }

      // Update device last reading time
      const updateQuery = 'UPDATE iot_devices SET last_reading_at = NOW() WHERE id = $1';
      await pool.query(updateQuery, [deviceId]);

      res.status(201).json({
        success: true,
        count: results.length,
        readings: results,
        message: `${results.length} sensor readings recorded successfully`
      });
    } catch (error) {
      next(error);
    }
  }

  // Generate random sample IoT sensor data for crop listing
  static async generateSampleData(req, res, next) {
    try {
      const { numReadings = 12 } = req.query; // Default 12 readings (3 hours at 15-min intervals)
      const count = Math.min(Math.max(parseInt(numReadings) || 12, 5), 100); // Min 5, Max 100

      const sampleData = [];
      const now = new Date();

      // Generate random sensor readings with optimal ranges
      for (let i = count - 1; i >= 0; i--) {
        const timestamp = new Date(now - i * 15 * 60 * 1000); // 15 min intervals

        // Random values within optimal/realistic ranges
        const reading = {
          timestamp: timestamp.toISOString(),
          mq2: parseFloat((95 + Math.random() * 15).toFixed(1)), // 95-110 PPM (optimal <100)
          mq4: parseFloat((40 + Math.random() * 8).toFixed(1)), // 40-48 PPM (optimal <45)
          mq6: parseFloat((48 + Math.random() * 8).toFixed(1)), // 48-56 PPM (optimal <50)
          mq135: parseFloat((52 + Math.random() * 10).toFixed(1)), // 52-62 PPM (optimal <50)
          temperature: parseFloat((5 + Math.random() * 5).toFixed(1)), // 5-10°C (optimal 0-10°C)
          humidity: parseFloat((88 + Math.random() * 6).toFixed(1)), // 88-94% (optimal 85-95%)
          ldr: Math.floor(120 + Math.random() * 40) // 120-160 Lux (optimal <500)
        };

        sampleData.push(reading);
      }

      // Calculate quality score from sample data
      const avgReading = {
        mq2: sampleData.reduce((sum, r) => sum + r.mq2, 0) / count,
        mq4: sampleData.reduce((sum, r) => sum + r.mq4, 0) / count,
        mq6: sampleData.reduce((sum, r) => sum + r.mq6, 0) / count,
        mq135: sampleData.reduce((sum, r) => sum + r.mq135, 0) / count,
        temperature: sampleData.reduce((sum, r) => sum + r.temperature, 0) / count,
        humidity: sampleData.reduce((sum, r) => sum + r.humidity, 0) / count,
        ldr: sampleData.reduce((sum, r) => sum + r.ldr, 0) / count
      };

      const qualityResult = IoTDeviceService.calculateQualityScore(avgReading);

      res.json({
        success: true,
        data: sampleData,
        count: sampleData.length,
        averages: avgReading,
        quality: qualityResult,
        message: `Generated ${count} random sample IoT sensor readings`,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = IoTController;
