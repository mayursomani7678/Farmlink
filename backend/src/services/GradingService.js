const pool = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class GradingService {
  /**
   * Generate final grade by combining image and IoT certificates
   * IoT certificate is optional
   */
  async generateFinalGrade(cropId, imageCertId, iotCertId) {
    try {
      // Fetch certificates
      const imageCert = await this._getImageCertificate(imageCertId);

      if (!imageCert) {
        throw new Error('Image certificate not found');
      }

      // If no IoT certificate, use image-only grading
      if (!iotCertId) {
        const gradingResult = await this._saveGradingResult({
          cropId,
          imageCertId,
          iotCertId: null,
          imageGrade: imageCert.grade,
          iotGrade: null,
          imageWeight: 1.0,
          iotWeight: 0,
          finalScore: this._gradeToScore(imageCert.grade),
          finalGrade: imageCert.grade
        });

        return {
          success: true,
          gradingResultId: gradingResult.id,
          imageGrade: imageCert.grade,
          iotGrade: null,
          finalGrade: imageCert.grade,
          finalScore: this._gradeToScore(imageCert.grade),
          details: {
            imageQualityScore: imageCert.overall_quality_score,
            iotEnvironmentalScore: null,
            weights: { imageWeight: 1.0, iotWeight: 0 },
            note: 'Grade based on image analysis only (no IoT data available)'
          }
        };
      }

      // If IoT cert exists, combine both
      const iotCert = await this._getIoTCertificate(iotCertId);

      // Grade weights (configurable)
      const imageWeight = 0.7; // Image grading is more critical
      const iotWeight = 0.3;   // IoT is supplementary

      // Convert letter grades to numeric scores
      const imageScore = this._gradeToScore(imageCert.grade);
      const iotScore = this._gradeToScore(iotCert.grade);

      // Calculate weighted final score
      const finalScore = (imageScore * imageWeight) + (iotScore * iotWeight);
      const finalGrade = this._scoreToGrade(finalScore);

      // Save grading result
      const gradingResult = await this._saveGradingResult({
        cropId,
        imageCertId,
        iotCertId,
        imageGrade: imageCert.grade,
        iotGrade: iotCert.grade,
        imageWeight,
        iotWeight,
        finalScore,
        finalGrade
      });

      return {
        success: true,
        gradingResultId: gradingResult.id,
        imageGrade: imageCert.grade,
        iotGrade: iotCert.grade,
        finalGrade,
        finalScore: parseFloat(finalScore.toFixed(2)),
        details: {
          imageQualityScore: imageCert.overall_quality_score,
          iotEnvironmentalScore: iotCert.environmental_quality_score,
          weights: { imageWeight, iotWeight }
        }
      };
    } catch (error) {
      throw new Error(`Grading failed: ${error.message}`);
    }
  }

  /**
   * Convert letter grade to numeric score
   * @private
   */
  _gradeToScore(grade) {
    const gradeScores = {
      'A': 1.0,
      'B': 0.75,
      'C': 0.5
    };
    return gradeScores[grade] || 0.5;
  }

  /**
   * Convert numeric score to letter grade
   * @private
   */
  _scoreToGrade(score) {
    if (score >= 0.85) {
      return 'A';
    } else if (score >= 0.65) {
      return 'B';
    } else {
      return 'C';
    }
  }

  /**
   * Fetch image quality certificate
   * @private
   */
  async _getImageCertificate(certId) {
    const query = 'SELECT * FROM image_quality_certificates WHERE id = $1';
    const result = await pool.query(query, [certId]);
    return result.rows[0];
  }

  /**
   * Fetch IoT quality certificate
   * @private
   */
  async _getIoTCertificate(certId) {
    const query = 'SELECT * FROM iot_quality_certificates WHERE id = $1';
    const result = await pool.query(query, [certId]);
    return result.rows[0];
  }

  /**
   * Save grading result
   * @private
   */
  async _saveGradingResult(gradingData) {
    const {
      cropId,
      imageCertId,
      iotCertId,
      imageGrade,
      iotGrade,
      imageWeight,
      iotWeight,
      finalScore,
      finalGrade
    } = gradingData;

    const id = uuidv4();
    const query = `
      INSERT INTO grading_results 
      (id, crop_id, image_cert_id, iot_cert_id, image_grade, iot_grade, 
       image_weight, iot_weight, final_grade, final_score)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *;
    `;

    const values = [
      id, cropId, imageCertId, iotCertId, imageGrade, iotGrade,
      imageWeight, iotWeight, finalGrade, finalScore
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Get grading result for a crop
   */
  async getGradingResult(cropId) {
    const query = `
      SELECT * FROM grading_results 
      WHERE crop_id = $1 
      ORDER BY graded_at DESC 
      LIMIT 1
    `;
    const result = await pool.query(query, [cropId]);
    return result.rows[0];
  }

  /**
   * Re-grade a crop (if certificates are updated)
   */
  async regrade(cropId) {
    // Get latest certificates
    const imageCertQuery = `
      SELECT * FROM image_quality_certificates 
      WHERE crop_id = $1 
      ORDER BY created_at DESC LIMIT 1
    `;
    const iotCertQuery = `
      SELECT * FROM iot_quality_certificates 
      WHERE crop_id = $1 
      ORDER BY created_at DESC LIMIT 1
    `;

    const imageCertResult = await pool.query(imageCertQuery, [cropId]);
    const iotCertResult = await pool.query(iotCertQuery, [cropId]);

    if (imageCertResult.rows.length === 0 || iotCertResult.rows.length === 0) {
      throw new Error('Cannot regrade: Missing certificates');
    }

    return await this.generateFinalGrade(
      cropId,
      imageCertResult.rows[0].id,
      iotCertResult.rows[0].id
    );
  }
}

module.exports = new GradingService();
