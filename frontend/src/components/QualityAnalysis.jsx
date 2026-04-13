import React, { useState, useRef } from 'react';
import { fpoService } from '../services/api';
import '../styles/ImageUpload.css';

export const ImageAnalysis = ({ cropId }) => {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const fileInputRef = useRef(null);

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!image) {
      alert('Please select an image');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('image', image);
    formData.append('cropId', cropId);

    try {
      const response = await fpoService.analyzeImage(formData);
      setResult(response.data);
    } catch (error) {
      console.error('Analysis failed:', error);
      alert('Failed to analyze image');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="image-analysis">
      <h2>🖼️ Grape Image Analysis (YOLOv3)</h2>

      <div className="upload-section">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageSelect}
          style={{ display: 'none' }}
        />
        <button
          className="btn btn-secondary"
          onClick={() => fileInputRef.current.click()}
        >
          Select Image
        </button>

        {preview && <img src={preview} alt="Preview" className="preview" />}

        <button
          className="btn btn-primary"
          onClick={handleAnalyze}
          disabled={!image || loading}
        >
          {loading ? 'Analyzing...' : 'Analyze Image'}
        </button>
      </div>

      {result && (
        <div className="result-section">
          <h3>Analysis Results</h3>
          <div className="results-grid">
            <div className="result-card">
              <h4>Grade</h4>
              <p className={`grade grade-${result.analysis.grade}`}>
                {result.analysis.grade}
              </p>
            </div>
            <div className="result-card">
              <h4>Spoilage</h4>
              <p>{result.analysis.qualityMetrics.spoilagePercentage.toFixed(1)}%</p>
            </div>
            <div className="result-card">
              <h4>Freshness</h4>
              <p>{(result.analysis.qualityMetrics.freshnessScore * 100).toFixed(1)}%</p>
            </div>
            <div className="result-card">
              <h4>Overall Quality</h4>
              <p>{(result.analysis.qualityMetrics.overallQualityScore * 100).toFixed(1)}%</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const IoTDataUpload = ({ cropId }) => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile);
    } else {
      alert('Please select a CSV file');
    }
  };

  const handleUpload = async () => {
    if (!file) {
      alert('Please select a CSV file');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('csv', file);
    formData.append('cropId', cropId);

    try {
      const response = await fpoService.uploadIoTCertificate(formData);
      setResult(response.data);
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to upload IoT data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="iot-upload">
      <h2>📊 IoT Sensor Data Upload</h2>

      <div className="upload-section">
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
        <button
          className="btn btn-secondary"
          onClick={() => fileInputRef.current.click()}
        >
          Select CSV File
        </button>

        {file && <p>Selected: {file.name}</p>}

        <button
          className="btn btn-primary"
          onClick={handleUpload}
          disabled={!file || loading}
        >
          {loading ? 'Uploading...' : 'Upload IoT Data'}
        </button>
      </div>

      {result && (
        <div className="result-section">
          <h3>IoT Certificate Results</h3>
          <div className="results-grid">
            <div className="result-card">
              <h4>Grade</h4>
              <p className={`grade grade-${result.sensorData.grade}`}>
                {result.sensorData.grade}
              </p>
            </div>
            <div className="result-card">
              <h4>Temperature</h4>
              <p>{result.sensorData.temperature}°C</p>
            </div>
            <div className="result-card">
              <h4>Humidity</h4>
              <p>{result.sensorData.humidity}%</p>
            </div>
            <div className="result-card">
              <h4>Environmental Quality</h4>
              <p>{(result.sensorData.environmentalQualityScore * 100).toFixed(1)}%</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
