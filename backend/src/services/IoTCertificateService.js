const csv = require('csv-parser');
const fs = require('fs');
const pool = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class IoTCertificateService {
  /**
   * Parse IoT sensor data from CSV file
   * @param {string} filePath - Path to CSV file
   * @returns {Promise<Object>} Parsed sensor readings
   */
  async parseIoTCertificateCSV(filePath) {
    return new Promise((resolve, reject) => {
      const sensorReadings = [];

      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (row) => {
          sensorReadings.push(this._normalizeRow(row));
        })
        .on('end', () => {
          try {
            const processed = this._processSensorReadings(sensorReadings);
            resolve(processed);
          } catch (error) {
            reject(new Error(`Failed to process sensor readings: ${error.message}`));
          }
        })
        .on('error', (error) => {
          reject(new Error(`CSV parsing error: ${error.message}`));
        });
    });
  }

  /**
   * Normalize CSV row to standard format
   * @private
   */
  _normalizeRow(row) {
    return {
      mq2: parseFloat(row.mq2 || row.MQ2 || 0),
      mq4: parseFloat(row.mq4 || row.MQ4 || 0),
      mq6: parseFloat(row.mq6 || row.MQ6 || 0),
      mq135: parseFloat(row.mq135 || row.MQ135 || 0),
      temperature: parseFloat(row.temperature || row.temp || 0),
      humidity: parseFloat(row.humidity || row.humid || 0),
      ldr: parseFloat(row.ldr || row.light || 0),
      timestamp: row.timestamp || new Date().toISOString()
    };
  }

  /**
   * Process and aggregate sensor readings
   * @private
   */
  _processSensorReadings(readings) {
    if (readings.length === 0) {
      throw new Error('No sensor readings found in CSV');
    }

    // Calculate averages
    const avgMQ2 = readings.reduce((sum, r) => sum + r.mq2, 0) / readings.length;
    const avgMQ4 = readings.reduce((sum, r) => sum + r.mq4, 0) / readings.length;
    const avgMQ6 = readings.reduce((sum, r) => sum + r.mq6, 0) / readings.length;
    const avgMQ135 = readings.reduce((sum, r) => sum + r.mq135, 0) / readings.length;
    const avgTemp = readings.reduce((sum, r) => sum + r.temperature, 0) / readings.length;
    const avgHumid = readings.reduce((sum, r) => sum + r.humidity, 0) / readings.length;
    const avgLDR = readings.reduce((sum, r) => sum + r.ldr, 0) / readings.length;

    // Calculate quality score
    const environmentalScore = this._calculateEnvironmentalScore({
      mq2: avgMQ2,
      mq4: avgMQ4,
      mq6: avgMQ6,
      mq135: avgMQ135,
      temperature: avgTemp,
      humidity: avgHumid,
      ldr: avgLDR
    });

    return {
      mq2Value: parseFloat(avgMQ2.toFixed(2)),
      mq4Value: parseFloat(avgMQ4.toFixed(2)),
      mq6Value: parseFloat(avgMQ6.toFixed(2)),
      mq135Value: parseFloat(avgMQ135.toFixed(2)),
      temperature: parseFloat(avgTemp.toFixed(2)),
      humidity: parseFloat(avgHumid.toFixed(2)),
      ldrLightLevel: parseFloat(avgLDR.toFixed(2)),
      environmentalQualityScore: environmentalScore,
      grade: this._determineIoTGrade(environmentalScore),
      readingsCount: readings.length
    };
  }

  /**
   * Calculate environmental quality score from sensor data
   * @private
   */
  _calculateEnvironmentalScore(sensorData) {
    // Optimal ranges for grape storage
    const optimalTemp = { min: 0, max: 10 }; // Cold storage
    const optimalHumid = { min: 85, max: 95 }; // High humidity
    const optimalLight = { min: 0, max: 500 }; // Low light
    const optimalGas = { min: 0, max: 100 }; // Low harmful gases

    let score = 1.0;

    // Temperature score
    const tempScore = this._calculateRangeScore(
      sensorData.temperature,
      optimalTemp.min,
      optimalTemp.max,
      1
    );

    // Humidity score
    const humidScore = this._calculateRangeScore(
      sensorData.humidity,
      optimalHumid.min,
      optimalHumid.max,
      1
    );

    // Light score (lower is better)
    const lightScore = Math.min(1, 1 - (sensorData.ldrLightLevel / 1000));

    // Gas score (lower is better, penalize high values)
    const avgGas = (sensorData.mq2 + sensorData.mq4 + sensorData.mq6 + sensorData.mq135) / 4;
    const gasScore = Math.max(0, 1 - (avgGas / 500));

    // Weighted average
    score = (tempScore * 0.3 + humidScore * 0.3 + lightScore * 0.2 + gasScore * 0.2);

    return parseFloat(score.toFixed(2));
  }

  /**
   * Calculate score based on range proximity
   * @private
   */
  _calculateRangeScore(value, min, max, maxPenalty) {
    if (value >= min && value <= max) {
      return 1.0;
    }

    const distanceFromRange = Math.min(Math.abs(value - min), Math.abs(value - max));
    const rangeWidth = max - min;
    const penalty = Math.min(maxPenalty, (distanceFromRange / rangeWidth) * 0.5);

    return Math.max(0, 1 - penalty);
  }

  /**
   * Determine IoT grade based on environmental quality
   * @private
   */
  _determineIoTGrade(score) {
    // IoT grading is less critical than image grading
    // A: Excellent storage conditions
    // B: Acceptable conditions
    // C: Poor conditions
    if (score >= 0.80) {
      return 'A';
    } else if (score >= 0.60) {
      return 'B';
    } else {
      return 'C';
    }
  }

  /**
   * Save IoT certificate to database
   */
  async saveIoTCertificate(cropId, sensorData, csvPath) {
    const id = uuidv4();

    const query = `
      INSERT INTO iot_quality_certificates 
      (id, crop_id, csv_file_path, mq2_value, mq4_value, mq6_value, mq135_value, 
       temperature, humidity, ldr_light_level, environmental_quality_score, grade, processed_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, CURRENT_TIMESTAMP)
      RETURNING *;
    `;

    const values = [
      id,
      cropId,
      csvPath,
      sensorData.mq2Value,
      sensorData.mq4Value,
      sensorData.mq6Value,
      sensorData.mq135Value,
      sensorData.temperature,
      sensorData.humidity,
      sensorData.ldrLightLevel,
      sensorData.environmentalQualityScore,
      sensorData.grade
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Get IoT certificate by crop ID
   */
  async getIoTCertificateByCropId(cropId) {
    const query = 'SELECT * FROM iot_quality_certificates WHERE crop_id = $1 ORDER BY uploaded_at DESC LIMIT 1';
    const result = await pool.query(query, [cropId]);
    return result.rows[0];
  }
}

module.exports = new IoTCertificateService();
