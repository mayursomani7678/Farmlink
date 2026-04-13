const pool = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class IoTDeviceService {
  // Register IoT device for a crop
  static async registerDevice(cropId, deviceName, deviceType = 'environmental_sensor') {
    try {
      const deviceId = uuidv4();
      const query = `
        INSERT INTO iot_devices (id, crop_id, device_name, device_type, status)
        VALUES ($1, $2, $3, $4, 'active')
        RETURNING *
      `;
      
      const result = await pool.query(query, [deviceId, cropId, deviceName, deviceType]);
      return result.rows[0];
    } catch (error) {
      throw new Error(`Failed to register IoT device: ${error.message}`);
    }
  }

  // Get device credentials
  static async getDevice(deviceId) {
    try {
      const query = 'SELECT * FROM iot_devices WHERE id = $1';
      const result = await pool.query(query, [deviceId]);
      return result.rows[0];
    } catch (error) {
      throw new Error(`Failed to retrieve device: ${error.message}`);
    }
  }

  // Ingest real-time sensor readings
  static async ingestSensorReading(deviceId, sensorData) {
    try {
      const device = await this.getDevice(deviceId);
      if (!device) {
        throw new Error('Device not found');
      }

      const readingId = uuidv4();
      const query = `
        INSERT INTO iot_sensor_readings (
          id, device_id, crop_id,
          mq2_value, mq4_value, mq6_value, mq135_value,
          temperature, humidity, ldr_light_level,
          raw_data, received_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
        RETURNING *
      `;

      const result = await pool.query(query, [
        readingId,
        deviceId,
        device.crop_id,
        sensorData.mq2 || null,
        sensorData.mq4 || null,
        sensorData.mq6 || null,
        sensorData.mq135 || null,
        sensorData.temperature || null,
        sensorData.humidity || null,
        sensorData.ldr || null,
        JSON.stringify(sensorData)
      ]);

      return result.rows[0];
    } catch (error) {
      throw new Error(`Failed to ingest sensor reading: ${error.message}`);
    }
  }

  // Get latest readings for a device
  static async getLatestReadings(deviceId, limit = 10) {
    try {
      const query = `
        SELECT * FROM iot_sensor_readings
        WHERE device_id = $1
        ORDER BY received_at DESC
        LIMIT $2
      `;
      
      const result = await pool.query(query, [deviceId, limit]);
      return result.rows;
    } catch (error) {
      throw new Error(`Failed to retrieve readings: ${error.message}`);
    }
  }

  // Get average readings over time period
  static async getAverageReadings(deviceId, minutesBack = 60) {
    try {
      const query = `
        SELECT
          AVG(mq2_value) as avg_mq2,
          AVG(mq4_value) as avg_mq4,
          AVG(mq6_value) as avg_mq6,
          AVG(mq135_value) as avg_mq135,
          AVG(temperature) as avg_temperature,
          AVG(humidity) as avg_humidity,
          AVG(ldr_light_level) as avg_ldr,
          MIN(received_at) as period_start,
          MAX(received_at) as period_end,
          COUNT(*) as reading_count
        FROM iot_sensor_readings
        WHERE device_id = $1
        AND received_at > NOW() - INTERVAL '${minutesBack} minutes'
      `;
      
      const result = await pool.query(query, [deviceId]);
      return result.rows[0];
    } catch (error) {
      throw new Error(`Failed to calculate averages: ${error.message}`);
    }
  }

  // Validate sensor readings against optimal ranges
  static validateReadings(reading) {
    const validation = {
      temperature_optimal: reading.temperature >= 0 && reading.temperature <= 10,
      humidity_optimal: reading.humidity >= 85 && reading.humidity <= 95,
      ldr_optimal: reading.ldr_light_level < 500,
      gas_levels_acceptable: reading.mq2 < 400 && reading.mq4 < 1000 && reading.mq6 < 10000
    };

    validation.overall_optimal = Object.values(validation).every(v => v);
    return validation;
  }

  // Generate quality score from readings
  static calculateQualityScore(reading) {
    let score = 100;
    const validation = this.validateReadings(reading);

    if (!validation.temperature_optimal) score -= 15;
    if (!validation.humidity_optimal) score -= 15;
    if (!validation.ldr_optimal) score -= 10;
    if (!validation.gas_levels_acceptable) score -= 25;

    const percentage = Math.max(0, Math.min(100, score)) / 100;
    return {
      score: percentage,
      grade: percentage >= 0.85 ? 'A' : percentage >= 0.65 ? 'B' : 'C',
      validation
    };
  }

  // List all devices for a crop
  static async getCropDevices(cropId) {
    try {
      const query = `
        SELECT * FROM iot_devices
        WHERE crop_id = $1
        ORDER BY created_at DESC
      `;
      
      const result = await pool.query(query, [cropId]);
      return result.rows;
    } catch (error) {
      throw new Error(`Failed to retrieve crop devices: ${error.message}`);
    }
  }

  // Delete device
  static async deleteDevice(deviceId) {
    try {
      const query = 'DELETE FROM iot_devices WHERE id = $1 RETURNING *';
      const result = await pool.query(query, [deviceId]);
      return result.rows[0];
    } catch (error) {
      throw new Error(`Failed to delete device: ${error.message}`);
    }
  }
}

module.exports = IoTDeviceService;
