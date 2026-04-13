const { PythonShell } = require('python-shell');
const path = require('path');
const fs = require('fs');

class YOLOv3Service {
  constructor() {
    this.modelPath = process.env.YOLOV3_MODEL_PATH || './models/yolov3.weights';
    this.configPath = process.env.YOLOV3_CONFIG_PATH || './models/yolov3.cfg';
    this.namesPath = process.env.YOLOV3_NAMES_PATH || './models/coco.names';
  }

  /**
   * Analyze grape image using YOLOv3
   * @param {string} imagePath - Path to the grape image
   * @returns {Promise<Object>} Detection results with quality metrics
   */
  async analyzeGrapeImage(imagePath) {
    try {
      if (!fs.existsSync(imagePath)) {
        throw new Error(`Image file not found: ${imagePath}`);
      }

      // Call Python script for YOLOv3 analysis
      const results = await this._runYOLOv3Detection(imagePath);
      
      // Process detection results
      const qualityMetrics = results.quality_metrics || this._calculateQualityMetrics(results);
      
      return {
        success: true,
        imagePath,
        detections: results.detections || [],
        qualityMetrics,
        grade: results.grade || this._determineGrade(qualityMetrics),
        confidence: results.overall_confidence || 0.7,
        detectionMethod: results.detection_method || 'fallback'
      };
    } catch (error) {
      console.error('YOLOv3 analysis error:', error);
      throw new Error(`Failed to analyze image: ${error.message}`);
    }
  }

  /**
   * Run YOLOv3 detection via Python
   * @private
   */
  async _runYOLOv3Detection(imagePath) {
    return new Promise((resolve, reject) => {
      const options = {
        mode: 'text',
        pythonPath: 'python3',
        scriptPath: path.join(__dirname, '../python_scripts'),
        args: [imagePath],
        timeout: 30000, // 30 second timeout
        stderrParser: (line) => {
          // Suppress all stderr output (warnings, info messages)
          // Don't log to console to avoid confusion
        }
      };

      PythonShell.run('yolov3_detector.py', options, (err, results) => {
        if (err) {
          console.error('❌ Python shell error:', err);
          reject(new Error(`Python execution failed: ${err.message}`));
        } else if (!results || results.length === 0) {
          reject(new Error('No output from Python script'));
        } else {
          try {
            // Filter out non-JSON output by looking for lines that start with '{'
            const jsonLine = results.find(line => line.trim().startsWith('{'));
            
            if (!jsonLine) {
              console.error('❌ No JSON output found in Python results');
              console.error('Raw output:', results);
              reject(new Error('Failed to parse Python output: No JSON found'));
              return;
            }
            
            console.log('✅ YOLO analysis completed');
            const result = JSON.parse(jsonLine);
            resolve(result);
          } catch (parseErr) {
            console.error('❌ Parse error:', parseErr.message);
            console.error('Attempted to parse:', results[results.length - 1]);
            reject(new Error(`Failed to parse Python output: ${parseErr.message}`));
          }
        }
      });
    });
  }

  /**
   * Calculate quality metrics from detections
   * @private
   */
  _calculateQualityMetrics(results) {
    const detections = results.detections || [];
    
    // Count spoiled/damaged grapes
    const damagedCount = detections.filter(d => d.class === 'damage' || d.class === 'spoilage').length;
    const totalCount = detections.length;
    const spoilagePercentage = totalCount > 0 ? (damagedCount / totalCount) * 100 : 0;

    // Freshness based on detected freshness indicators
    const freshnessScore = detections.filter(d => d.class === 'fresh').length / Math.max(totalCount, 1);

    // Color/texture uniformity
    const colorVariance = this._calculateColorVariance(results.color_data || []);
    const colorTextureScore = Math.max(0, 1 - (colorVariance / 100));

    // Overall quality score
    const overallScore = (
      (1 - (spoilagePercentage / 100)) * 0.5 +
      freshnessScore * 0.3 +
      colorTextureScore * 0.2
    );

    return {
      spoilagePercentage: parseFloat(spoilagePercentage.toFixed(2)),
      freshnessScore: parseFloat(freshnessScore.toFixed(2)),
      colorTextureScore: parseFloat(colorTextureScore.toFixed(2)),
      overallQualityScore: parseFloat(overallScore.toFixed(2)),
      detectionCount: totalCount,
      damagedCount
    };
  }

  /**
   * Calculate color variance for uniformity assessment
   * @private
   */
  _calculateColorVariance(colorData) {
    if (!colorData || colorData.length === 0) return 0;
    
    const mean = colorData.reduce((a, b) => a + b, 0) / colorData.length;
    const variance = colorData.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / colorData.length;
    return Math.sqrt(variance);
  }

  /**
   * Determine grade based on quality metrics
   * @private
   */
  _determineGrade(metrics) {
    const score = metrics.overallQualityScore;

    if (metrics.spoilagePercentage > 10) {
      return 'C'; // Significant spoilage
    }

    if (score >= 0.85) {
      return 'A'; // Premium: High freshness, low spoilage, uniform color
    } else if (score >= 0.70) {
      return 'B'; // Standard: Acceptable quality
    } else {
      return 'C'; // Low quality: Significant issues
    }
  }

  /**
   * Batch analyze multiple grape images
   */
  async analyzeMultipleImages(imagePaths) {
    const results = [];
    
    for (const imagePath of imagePaths) {
      try {
        const result = await this.analyzeGrapeImage(imagePath);
        results.push(result);
      } catch (error) {
        results.push({
          success: false,
          imagePath,
          error: error.message
        });
      }
    }
    
    return results;
  }
}

module.exports = new YOLOv3Service();
