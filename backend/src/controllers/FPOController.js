const Farmer = require('../models/Farmer');
const Crop = require('../models/Crop');
const YOLOv3Service = require('../services/YOLOv3Service');
const IoTCertificateService = require('../services/IoTCertificateService');
const GradingService = require('../services/GradingService');
const pool = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class FPOController {
  /**
   * Get FPO dashboard statistics
   */
  async getDashboard(req, res, next) {
    try {
      let fpoId = req.query.fpoId;
      
      // If no FPO ID provided, try to get from authenticated user
      if (!fpoId && req.user) {
        const fpoQuery = 'SELECT id FROM fpos WHERE user_id = $1 LIMIT 1';
        const fpoResult = await pool.query(fpoQuery, [req.user.id]);
        if (fpoResult.rows.length > 0) {
          fpoId = fpoResult.rows[0].id;
        }
      }

      if (!fpoId) {
        return res.status(400).json({ error: 'FPO ID required' });
      }

      const query = `
        SELECT 
          (SELECT COUNT(*) FROM farmers WHERE fpo_id = $1) as total_farmers,
          (SELECT SUM(quantity) FROM product_listings WHERE fpo_id = $1 AND status = 'available') as available_quantity,
          (SELECT COUNT(*) FROM transactions WHERE fpo_id = $1 AND transaction_status = 'completed') as total_transactions,
          (SELECT SUM(total_price) FROM transactions WHERE fpo_id = $1 AND transaction_status = 'completed') as total_revenue,
          (SELECT AVG(rating) FROM buyers) as avg_buyer_rating
      `;

      const result = await pool.query(query, [fpoId]);

      res.json({
        success: true,
        dashboard: result.rows[0]
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create farmer profile (FPO creates, farmer doesn't need account)
   */
  async createFarmer(req, res, next) {
    try {
      const { farmerName, plotSize, plotLocation, plotLat, plotLon, yearsOfExperience, phone, aadharNumber } = req.body;
      
      // Get FPO ID from authenticated user
      let fpoId = req.query.fpoId || req.body.fpoId;
      
      if (!fpoId && req.user) {
        // Get FPO ID from user's FPO record
        const fpoQuery = 'SELECT id FROM fpos WHERE user_id = $1 LIMIT 1';
        const fpoResult = await pool.query(fpoQuery, [req.user.id]);
        
        if (fpoResult.rows.length > 0) {
          fpoId = fpoResult.rows[0].id;
          console.log('📍 [FARMER] Retrieved FPO ID from user:', { userId: req.user.id, fpoId });
        }
      }

      if (!fpoId) {
        console.log('❌ [FARMER] FPO ID not found for user:', req.user?.id);
        return res.status(400).json({ error: 'FPO account not setup. Please check your FPO registration.' });
      }

      if (!farmerName) {
        return res.status(400).json({ error: 'Farmer name required' });
      }

      if (!aadharNumber) {
        return res.status(400).json({ error: 'Aadhar number is required' });
      }

      if (!/^\d{12}$/.test(aadharNumber)) {
        return res.status(400).json({ error: 'Aadhar number must be exactly 12 digits' });
      }

      console.log('🌾 [FARMER] Creating farmer:', { farmerName, aadharNumber, fpoId });
      
      const farmer = await Farmer.create({
        fpoId,
        farmerName,
        phone,
        plotSize,
        plotLocation,
        plotLat,
        plotLon,
        yearsOfExperience,
        aadharNumber
      });

      console.log('✅ [FARMER] Farmer created successfully:', farmer.id);
      
      res.status(201).json({ 
        success: true, 
        farmer,
        message: `Farmer created. Farmer ID: ${farmer.id}`
      });
    } catch (error) {
      console.error('❌ [FARMER] Error creating farmer:', error.message);
      // Check for unique constraint violation
      if (error.code === '23505' && error.detail?.includes('aadhar_number')) {
        return res.status(400).json({ error: 'Aadhar number already exists. Each farmer must have a unique Aadhar number.' });
      }
      next(error);
    }
  }

  /**
   * Get farmers under FPO
   */
  async getFarmers(req, res, next) {
    try {
      let fpoId = req.query.fpoId;
      
      // If no FPO ID provided, try to get from authenticated user
      if (!fpoId && req.user) {
        const fpoQuery = 'SELECT id FROM fpos WHERE user_id = $1 LIMIT 1';
        const fpoResult = await pool.query(fpoQuery, [req.user.id]);
        if (fpoResult.rows.length > 0) {
          fpoId = fpoResult.rows[0].id;
        }
      }

      if (!fpoId) {
        return res.status(400).json({ error: 'FPO ID required' });
      }

      const farmers = await Farmer.findByFpoId(fpoId);

      res.json({ success: true, farmers });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create crop record
   */
  async createCrop(req, res, next) {
    try {
      const { farmerId, cropType, plantingDate, expectedHarvestDate, estimatedQuantity, variety } = req.body;

      const crop = await Crop.create({
        farmerId,
        cropType,
        plantingDate,
        expectedHarvestDate,
        estimatedQuantity,
        variety
      });

      res.status(201).json({ success: true, crop });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get crops by FPO
   */
  async getCropsByFPO(req, res, next) {
    try {
      let fpoId = req.query.fpoId;
      
      // If no FPO ID provided, try to get from authenticated user
      if (!fpoId && req.user) {
        const fpoQuery = 'SELECT id FROM fpos WHERE user_id = $1 LIMIT 1';
        const fpoResult = await pool.query(fpoQuery, [req.user.id]);
        if (fpoResult.rows.length > 0) {
          fpoId = fpoResult.rows[0].id;
        }
      }

      if (!fpoId) {
        return res.status(400).json({ error: 'FPO ID required' });
      }

      const crops = await Crop.findByFpoId(fpoId);

      res.json({ success: true, crops });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Analyze grape image with YOLOv3
   */
  async analyzeGrapeImage(req, res, next) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'Image file required' });
      }

      const { cropId } = req.body;
      
      console.log('🖼️  [IMAGE] Analyzing image:', { imagePath: req.file.path, cropId });

      // Analyze image
      const analysisResult = await YOLOv3Service.analyzeGrapeImage(req.file.path);
      
      console.log('✅ [IMAGE] Analysis result:', analysisResult);

      // Extract quality metrics - handle both snake_case and camelCase keys
      const metrics = analysisResult.quality_metrics || analysisResult.qualityMetrics || {};
      const overallScore = parseFloat(metrics.overall_quality_score) || parseFloat(metrics.overallQualityScore) || 0;
      const spoilagePercentage = parseFloat(metrics.spoilage_percentage) || parseFloat(metrics.spoilagePercentage) || 0;
      const freshnessScore = parseFloat(metrics.freshness_score) || parseFloat(metrics.freshnessScore) || 0;
      const colorTextureScore = parseFloat(metrics.color_texture_score) || parseFloat(metrics.colorTextureScore) || 0;

      // Save certificate
      const id = uuidv4();
      const query = `
        INSERT INTO image_quality_certificates 
        (id, crop_id, image_path, overall_quality_score, spoilage_percentage, 
         freshness_score, color_texture_score, grade, model_version, detection_results, confidence_scores)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *;
      `;

      const values = [
        id,
        cropId,
        req.file.path,
        overallScore,
        spoilagePercentage,
        freshnessScore,
        colorTextureScore,
        analysisResult.grade || 'C',
        'YOLOv3',
        JSON.stringify(analysisResult.detections || []),
        JSON.stringify({ 
          overall_confidence: analysisResult.overall_confidence || analysisResult.confidence || 0,
          detection_method: analysisResult.detection_method || analysisResult.detectionMethod || 'fallback'
        })
      ];

      const result = await pool.query(query, values);
      
      console.log('✅ [IMAGE] Certificate saved:', result.rows[0].id);

      res.json({
        success: true,
        certificate: result.rows[0],
        analysis: analysisResult
      });
    } catch (error) {
      console.error('❌ [IMAGE] Error analyzing image:', error.message);
      res.status(500).json({ error: 'Failed to analyze image: ' + error.message });
    }
  }

  /**
   * Upload IoT sensor data certificate (CSV)
   */
  async uploadIoTCertificate(req, res, next) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'CSV file required' });
      }

      const { cropId } = req.body;

      // Parse CSV and process sensor data
      const sensorData = await IoTCertificateService.parseIoTCertificateCSV(req.file.path);

      // Save to database
      const certificate = await IoTCertificateService.saveIoTCertificate(cropId, sensorData, req.file.path);

      res.json({
        success: true,
        certificate,
        sensorData
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Generate final grade
   */
  async generateGrade(req, res, next) {
    try {
      const { cropId, imageCertificateId, iotCertificateId } = req.body;

      const gradingResult = await GradingService.generateFinalGrade(
        cropId,
        imageCertificateId,
        iotCertificateId
      );

      res.json({ success: true, gradingResult });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create product listing
   */
  async createListing(req, res, next) {
    try {
      let { cropId, quantity, fpoId } = req.body;

      // Validate quantity
      if (!quantity || quantity <= 0) {
        return res.status(400).json({ error: 'Quantity must be greater than 0' });
      }

      // Get FPO ID from authenticated user if not provided
      if (!fpoId && req.user) {
        const fpoQuery = 'SELECT id FROM fpos WHERE user_id = $1 LIMIT 1';
        const fpoResult = await pool.query(fpoQuery, [req.user.id]);
        
        if (fpoResult.rows.length > 0) {
          fpoId = fpoResult.rows[0].id;
          console.log('📍 [LISTING] Retrieved FPO ID from user:', { userId: req.user.id, fpoId });
        }
      }

      if (!fpoId) {
        console.log('❌ [LISTING] FPO ID not found for user:', req.user?.id);
        return res.status(400).json({ error: 'FPO ID required or not found. Please ensure you are logged in as FPO.' });
      }

      // Verify crop exists and belongs to this FPO's farmers
      const cropQuery = 'SELECT f.fpo_id FROM crops c JOIN farmers f ON c.farmer_id = f.id WHERE c.id = $1';
      const cropResult = await pool.query(cropQuery, [cropId]);

      if (cropResult.rows.length === 0) {
        return res.status(404).json({ error: 'Crop not found' });
      }

      if (cropResult.rows[0].fpo_id !== fpoId) {
        return res.status(403).json({ error: 'Unauthorized: Crop does not belong to your FPO' });
      }

      // Get grading result
      const gradeQuery = 'SELECT * FROM grading_results WHERE crop_id = $1 ORDER BY graded_at DESC LIMIT 1';
      const gradeResult = await pool.query(gradeQuery, [cropId]);

      if (gradeResult.rows.length === 0) {
        return res.status(400).json({ error: 'Crop must be graded first' });
      }

      const gradingResult = gradeResult.rows[0];

      console.log('📋 [LISTING] Creating listing:', { cropId, fpoId, quantity, grade: gradingResult.final_grade });

      // Get crop type for price lookup
      const cropTypeQuery = 'SELECT crop_type FROM crops WHERE id = $1';
      const cropTypeResult = await pool.query(cropTypeQuery, [cropId]);
      const cropType = cropTypeResult.rows[0]?.crop_type || 'Grapes';

      // Get market price for this crop and grade
      let pricePerKg = 0;
      const priceQuery = `
        SELECT price_per_kg FROM mandi_prices
        WHERE crop_name ILIKE $1 AND grade = $2
        LIMIT 1
      `;
      const priceResult = await pool.query(priceQuery, [cropType, gradingResult.final_grade]);
      if (priceResult.rows.length > 0) {
        pricePerKg = priceResult.rows[0].price_per_kg;
      }

      console.log('💰 [LISTING] Price per kg for', cropType, 'Grade', gradingResult.final_grade, ':', pricePerKg);

      // Create listing
      const listingId = uuidv4();
      const listingQuery = `
        INSERT INTO product_listings (id, crop_id, grading_result_id, fpo_id, quantity, grade, status, price_per_kg, expires_at)
        VALUES ($1, $2, $3, $4, $5, $6, 'available', $7, NOW() + INTERVAL '30 days')
        RETURNING *;
      `;

      const listingResult = await pool.query(listingQuery, [
        listingId, cropId, gradingResult.id, fpoId, quantity, gradingResult.final_grade, pricePerKg
      ]);

      console.log('✅ [LISTING] Listing created successfully:', listingId);

      res.status(201).json({
        success: true,
        listing: listingResult.rows[0]
      });
    } catch (error) {
      console.error('❌ [LISTING] Error creating listing:', error.message);
      next(error);
    }
  }

  /**
   * Get product listings for a farmer
   */
  async getListingsForFarmer(req, res, next) {
    try {
      const { farmerId } = req.params;

      if (!farmerId) {
        return res.status(400).json({ error: 'Farmer ID required' });
      }

      // Get all product listings for crops belonging to this farmer
      const listingsQuery = `
        SELECT 
          pl.id,
          pl.crop_id,
          pl.grading_result_id,
          pl.fpo_id,
          pl.quantity,
          pl.quantity_unit,
          pl.grade,
          pl.status,
          pl.created_at,
          pl.expires_at,
          c.crop_type,
          c.variety,
          c.estimated_quantity,
          c.expected_harvest_date,
          gr.image_grade,
          gr.iot_grade,
          gr.final_score
        FROM product_listings pl
        JOIN crops c ON pl.crop_id = c.id
        JOIN grading_results gr ON pl.grading_result_id = gr.id
        WHERE c.farmer_id = $1
        ORDER BY pl.created_at DESC
      `;

      const result = await pool.query(listingsQuery, [farmerId]);

      console.log(`📦 [LISTINGS] Found ${result.rows.length} listings for farmer ${farmerId}`);

      res.json({
        success: true,
        listings: result.rows
      });
    } catch (error) {
      console.error('❌ [LISTINGS] Error fetching listings:', error.message);
      next(error);
    }
  }

  /**
   * Get IoT sensor data for a crop
   */
  async getIoTDataForCrop(req, res, next) {
    try {
      const { cropId } = req.params;
      const { hoursBack = 24 } = req.query;

      // Get all devices for the crop
      const devicesQuery = `
        SELECT id FROM iot_devices WHERE crop_id = $1
      `;
      const devicesResult = await pool.query(devicesQuery, [cropId]);
      const deviceIds = devicesResult.rows.map(row => row.id);

      if (deviceIds.length === 0) {
        return res.json({
          success: true,
          iotData: {
            avg_temperature: null,
            avg_humidity: null,
            avg_light_intensity: null,
            reading_count: 0,
            devices: 0
          }
        });
      }

      // Get average readings from all devices
      const readingsQuery = `
        SELECT 
          ROUND(AVG(CAST(temperature AS NUMERIC)), 2) as avg_temperature,
          ROUND(AVG(CAST(humidity AS NUMERIC)), 2) as avg_humidity,
          ROUND(AVG(CAST(light_intensity AS NUMERIC)), 2) as avg_light_intensity,
          COUNT(*) as reading_count,
          MAX(created_at) as latest_reading
        FROM iot_sensor_readings
        WHERE device_id = ANY($1::uuid[])
        AND created_at >= NOW() - INTERVAL '${hoursBack} hours'
      `;

      const result = await pool.query(readingsQuery, [deviceIds]);

      res.json({
        success: true,
        iotData: result.rows[0] || {
          avg_temperature: null,
          avg_humidity: null,
          avg_light_intensity: null,
          reading_count: 0,
          latest_reading: null
        },
        devices: deviceIds.length,
        period_hours: hoursBack
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get the latest IoT certificate for a crop
   */
  async getIoTCertificateForCrop(req, res, next) {
    try {
      const { cropId } = req.params;
      
      const cert = await IoTCertificateService.getIoTCertificateByCropId(cropId);
      
      res.json({
        success: true,
        iotCertificate: cert || null
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create IoT certificate from manually entered sensor data
   */
  async createManualIoTCertificate(req, res, next) {
    try {
      const {
        crop_id,
        sensor_type,
        temperature,
        humidity,
        mq2_value,
        mq4_value,
        mq6_value,
        mq135_value,
        ldr_light_level,
        environmental_quality_score,
        grade
      } = req.body;

      if (!crop_id) {
        return res.status(400).json({ error: 'crop_id is required' });
      }

      const query = `
        INSERT INTO iot_quality_certificates
        (crop_id, sensor_type, temperature, humidity, mq2_value, mq4_value, mq6_value, mq135_value, ldr_light_level, environmental_quality_score, grade)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING id, crop_id, grade, environmental_quality_score
      `;

      const result = await pool.query(query, [
        crop_id,
        sensor_type || 'manual_input',
        temperature || 0,
        humidity || 0,
        mq2_value || 0,
        mq4_value || 0,
        mq6_value || 0,
        mq135_value || 0,
        ldr_light_level || 0,
        environmental_quality_score || 0.75,
        grade || 'B'
      ]);

      const certificate = result.rows[0];

      res.json({
        success: true,
        certificateId: certificate.id,
        message: 'IoT certificate created successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all farmer payments for the FPO
   */
  async getFarmerPayments(req, res, next) {
    try {
      const fpoId = req.user.fpo_id;

      const query = `
        SELECT 
          fp.id,
          fp.farmer_id,
          fp.purchase_id,
          fp.amount,
          fp.status,
          fp.paid_at,
          fp.given_at,
          fp.given_by_fpo,
          fp.created_at,
          f.farmer_name,
          f.phone,
          f.plot_location,
          p.quantity as purchase_quantity,
          c.crop_type,
          pl.grade
        FROM farmer_payments fp
        JOIN farmers f ON fp.farmer_id = f.id
        JOIN purchases p ON fp.purchase_id = p.id
        JOIN product_listings pl ON p.listing_id = pl.id
        JOIN crops c ON pl.crop_id = c.id
        WHERE fp.fpo_id = $1
        ORDER BY fp.created_at DESC
      `;

      const result = await pool.query(query, [fpoId]);

      // Calculate summary
      const summary = {
        total_pending: 0,
        total_pending_count: 0,
        total_completed: 0,
        total_completed_count: 0,
        total_all: 0
      };

      result.rows.forEach(payment => {
        const amount = parseFloat(payment.amount);
        summary.total_all += amount;
        
        if (payment.status === 'pending') {
          summary.total_pending += amount;
          summary.total_pending_count += 1;
        } else if (payment.status === 'paid' || payment.status === 'completed') {
          summary.total_completed += amount;
          summary.total_completed_count += 1;
        }
      });

      res.json({
        success: true,
        payments: result.rows,
        summary: {
          total_payments: summary.total_all,
          total_transactions: result.rows.length,
          pending_payments: summary.total_pending,
          pending_count: summary.total_pending_count,
          completed_payments: summary.total_completed,
          completed_count: summary.total_completed_count
        }
      });
    } catch (error) {
      console.error('❌ [FPO] Error getting farmer payments:', error.message);
      next(error);
    }
  }

  /**
   * Mark farmer payment as given (FPO paying farmer)
   */
  async markPaymentGiven(req, res, next) {
    try {
      const fpoId = req.user.fpo_id;
      const { paymentId } = req.params;

      // Verify payment belongs to this FPO and is pending
      const paymentCheck = await pool.query(
        `SELECT fp.*, f.farmer_name FROM farmer_payments fp
         JOIN farmers f ON fp.farmer_id = f.id
         WHERE fp.id = $1 AND fp.fpo_id = $2 AND fp.status = 'pending'`,
        [paymentId, fpoId]
      );

      if (paymentCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Payment not found or already processed' });
      }

      const payment = paymentCheck.rows[0];

      // Mark payment as given/paid
      const updated = await pool.query(
        `UPDATE farmer_payments 
         SET status = 'paid', given_at = NOW(), given_by_fpo = true
         WHERE id = $1
         RETURNING *`,
        [paymentId]
      );

      console.log(`✅ [FPO] Payment marked as given: ₹${payment.amount} to farmer ${payment.farmer_name}`);

      res.json({
        success: true,
        payment: updated.rows[0],
        message: `✅ Payment of ₹${payment.amount} marked as given to ${payment.farmer_name}`
      });
    } catch (error) {
      console.error('❌ [FPO] Error marking payment as given:', error.message);
      next(error);
    }
  }

  /**
   * Create farmer payment - DEPRECATED (created automatically)
   */
  async createFarmerPayment(req, res, next) {
    return res.status(400).json({ error: 'Payments created automatically on delivery' });
  }

  /**
   * Update payment status
   */
  async updatePaymentStatus(req, res, next) {
    try {
      const fpoId = req.user.fpo_id;
      const { paymentId } = req.params;
      const { status } = req.body;

      if (!status) {
        return res.status(400).json({ error: 'status is required' });
      }

      // Verify payment belongs to this FPO
      const paymentCheck = await pool.query(
        'SELECT id FROM farmer_payments WHERE id = $1 AND fpo_id = $2',
        [paymentId, fpoId]
      );

      if (paymentCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Payment not found' });
      }

      const updated = await pool.query(
        `UPDATE farmer_payments 
         SET status = $1
         WHERE id = $2
         RETURNING *`,
        [status, paymentId]
      );

      res.json({
        success: true,
        payment: updated.rows[0]
      });
    } catch (error) {
      console.error('❌ [FPO] Error updating payment:', error.message);
      next(error);
    }
  }
}


module.exports = new FPOController();
