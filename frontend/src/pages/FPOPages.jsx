import React, { useState, useEffect } from 'react';
import { fpoService, apiClient } from '../services/api';
import { useAuth } from '../context/AuthContext';
import MandiPriceDashboard from '../components/MandiPriceDashboard';
import '../styles/FPODashboard.css';

export const FPODashboard = () => {
  const { user, logout } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('farmers'); // farmers, products, mandi, payments

  useEffect(() => {
    fetchDashboard();
  }, [user]);

  const fetchDashboard = async () => {
    try {
      const response = await fpoService.getDashboard();
      setDashboard(response.data.dashboard);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  if (loading) return <div className="loading">Loading dashboard...</div>;

  return (
    <div className="fpo-dashboard">
      <div className="dashboard-header">
        <h1>🌱 FPO Dashboard</h1>
        <div className="header-actions">
          <span className="user-info">👤 {user?.fullName || user?.email}</span>
          <button className="btn btn-logout" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>

      <div className="dashboard-tabs">
        <button 
          className={`tab-btn ${activeTab === 'farmers' ? 'active' : ''}`}
          onClick={() => setActiveTab('farmers')}
        >
          Farmers
        </button>
        <button 
          className={`tab-btn ${activeTab === 'products' ? 'active' : ''}`}
          onClick={() => setActiveTab('products')}
        >
          Products
        </button>
        <button 
          className={`tab-btn ${activeTab === 'payments' ? 'active' : ''}`}
          onClick={() => setActiveTab('payments')}
        >
          💰 Payments
        </button>
        <button 
          className={`tab-btn ${activeTab === 'mandi' ? 'active' : ''}`}
          onClick={() => setActiveTab('mandi')}
        >
          📊 Mandi Prices
        </button>
      </div>

      {activeTab === 'farmers' && <FarmerManagement />}
      {activeTab === 'products' && <ProductListings />}
      {activeTab === 'payments' && <FarmerPayments />}
      {activeTab === 'mandi' && <MandiPriceDashboard />}
    </div>
  );
};

export const FarmerManagement = () => {
  const [farmers, setFarmers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedFarmer, setSelectedFarmer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    farmerName: '',
    plotSize: '',
    plotLocation: '',
    phone: '',
    aadharNumber: '',
    yearsOfExperience: ''
  });

  useEffect(() => {
    loadFarmers();
  }, []);

  const loadFarmers = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fpoService.getFarmers();
      setFarmers(response.data.farmers);
    } catch (error) {
      console.error('Failed to load farmers:', error);
      setError('Failed to load farmers. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!formData.farmerName.trim()) {
      setError('Farmer name is required');
      return;
    }

    if (!formData.aadharNumber.trim()) {
      setError('Aadhar number is required');
      return;
    }

    if (!/^\d{12}$/.test(formData.aadharNumber)) {
      setError('Aadhar number must be exactly 12 digits');
      return;
    }

    try {
      console.log('Creating farmer with data:', formData);
      await fpoService.createFarmer(formData);
      console.log('✅ Farmer created successfully');
      
      setFormData({
        farmerName: '',
        plotSize: '',
        plotLocation: '',
        phone: '',
        aadharNumber: '',
        yearsOfExperience: ''
      });
      setShowForm(false);
      loadFarmers();
      alert('✅ Farmer created successfully!');
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.message || 'Failed to create farmer';
      console.error('❌ Error creating farmer:', errorMsg);
      setError('❌ ' + errorMsg);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  if (loading) return <div className="loading">Loading farmers...</div>;

  return (
    <div className="farmer-management">
      {!selectedFarmer ? (
        <>
          <div className="section-header">
            <h2>👨‍🌾 Farmer Management</h2>
            <button 
              className="btn btn-primary"
              onClick={() => {
                setShowForm(!showForm);
                setError('');
              }}
            >
              {showForm ? 'Cancel' : '+ Add Farmer'}
            </button>
          </div>

          {error && <div className="error-box">{error}</div>}

          {showForm && (
            <form className="farmer-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Farmer Name *</label>
                <input
                  type="text"
                  name="farmerName"
                  placeholder="Enter farmer name"
                  value={formData.farmerName}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Aadhar Number *</label>
                  <input
                    type="text"
                    name="aadharNumber"
                    placeholder="12-digit Aadhar number"
                    value={formData.aadharNumber}
                    onChange={handleChange}
                    maxLength="12"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    placeholder="Phone number"
                    value={formData.phone}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Plot Size (acres)</label>
                  <input
                    type="number"
                    name="plotSize"
                    placeholder="Plot size"
                    value={formData.plotSize}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label>Years of Experience</label>
                  <input
                    type="number"
                    name="yearsOfExperience"
                    placeholder="Years"
                    value={formData.yearsOfExperience}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Plot Location</label>
                <input
                  type="text"
                  name="plotLocation"
                  placeholder="Location"
                  value={formData.plotLocation}
                  onChange={handleChange}
                />
              </div>

              <button type="submit" className="btn btn-primary">
                Create Farmer
              </button>
            </form>
          )}

          <div className="farmers-grid">
            {farmers.length === 0 ? (
              <div className="empty-state">
                <p>No farmers yet. Create one to get started!</p>
              </div>
            ) : (
              farmers.map((farmer) => (
                <div
                  key={farmer.id}
                  className="farmer-card"
                  onClick={() => setSelectedFarmer(farmer)}
                >
                  <div className="farmer-header">
                    <h3>{farmer.farmer_name}</h3>
                    <span className="farmer-id">{farmer.id.slice(0, 8)}</span>
                  </div>
                  <div className="farmer-details">
                    <p><strong>Aadhar:</strong> {farmer.aadhar_number || 'N/A'}</p>
                    <p><strong>Phone:</strong> {farmer.phone || 'N/A'}</p>
                    <p><strong>Location:</strong> {farmer.plot_location || 'N/A'}</p>
                    <p><strong>Plot Size:</strong> {farmer.plot_size || 'N/A'} acres</p>
                    <p><strong>Experience:</strong> {farmer.years_of_experience || 0} years</p>
                  </div>
                  <button className="btn btn-secondary">View Details →</button>
                </div>
              ))
            )}
          </div>
        </>
      ) : (
        <FarmerDetail farmer={selectedFarmer} onBack={() => setSelectedFarmer(null)} />
      )}
    </div>
  );
};

const FarmerDetail = ({ farmer, onBack }) => {
  const [crops, setCrops] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [selectedCrop, setSelectedCrop] = useState(null);
  const [resumingCrop, setResumingCrop] = useState(null);

  useEffect(() => {
    loadCropsAndProducts();
  }, [farmer.id]);

  const loadCropsAndProducts = async () => {
    try {
      setLoading(true);
      // Get crops by FPO and filter by farmer
      const cropsResponse = await fpoService.getCropsByFPO();
      const farmerCrops = cropsResponse.data.crops.filter(crop => crop.farmer_id === farmer.id);
      
      // Get product listings for this farmer
      let listingsMap = {};
      try {
        const listingsResponse = await fpoService.getListingsForFarmer(farmer.id);
        // Create a map of crop_id -> listing for easy lookup
        listingsResponse.data.listings.forEach(listing => {
          listingsMap[listing.crop_id] = listing;
        });
        console.log('📦 Loaded listings for farmer:', listingsMap);
      } catch (err) {
        console.warn('Failed to load listings, continuing without them:', err);
      }

      // Merge crops with their listing status
      const productsWithStatus = farmerCrops.map(crop => ({
        ...crop,
        listing: listingsMap[crop.id] || null,
        isListed: !!listingsMap[crop.id]
      }));

      setCrops(farmerCrops);
      // Display crops as products (including pending ones awaiting quality verification)
      setProducts(productsWithStatus);
    } catch (error) {
      console.error('Failed to load crops and products:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading farmer details...</div>;

  return (
    <div className="farmer-detail">
      <button className="btn btn-back" onClick={onBack}>← Back to Farmers</button>

      <div className="farmer-header-detail">
        <div>
          <h2>{farmer.farmer_name}</h2>
          <p className="farmer-id-detailed">Farmer ID: {farmer.id}</p>
        </div>
      </div>

      <div className="farmer-info-grid">
        <div className="info-box">
          <h4>📍 Location</h4>
          <p>{farmer.plot_location || 'N/A'}</p>
        </div>
        <div className="info-box">
          <h4>📞 Phone</h4>
          <p>{farmer.phone || 'N/A'}</p>
        </div>
        <div className="info-box">
          <h4>🌾 Plot Size</h4>
          <p>{farmer.plot_size || 'N/A'} acres</p>
        </div>
        <div className="info-box">
          <h4>📅 Experience</h4>
          <p>{farmer.years_of_experience || 0} years</p>
        </div>
      </div>

      <div className="section-divider"></div>

      <div className="products-section">
        <div className="section-header">
          <h3>🍇 Products (Grapes)</h3>
          <button 
            className="btn btn-primary"
            onClick={() => setShowAddProduct(!showAddProduct)}
          >
            {showAddProduct ? 'Cancel' : '+ Add Product'}
          </button>
        </div>

        {showAddProduct && (
          <AddProductForm 
            farmer={farmer}
            resumingCrop={resumingCrop}
            onSuccess={() => {
              setShowAddProduct(false);
              setResumingCrop(null);
              loadCropsAndProducts();
            }}
            onCancel={() => {
              setShowAddProduct(false);
              setResumingCrop(null);
            }}
          />
        )}

        {products.length === 0 ? (
          <div className="empty-state">
            <p>No products listed yet</p>
          </div>
        ) : (
          <div className="products-grid">
            {products.map((product) => (
              <div 
                key={product.id} 
                className="product-card"
                onClick={() => {
                  if (!product.isListed) {
                    setResumingCrop(product);
                    setShowAddProduct(true);
                  }
                }}
                style={{ cursor: product.isListed ? 'not-allowed' : 'pointer', opacity: product.isListed ? 0.7 : 1 }}
              >
                <div className="product-header">
                  <h4>{product.crop_type || product.crop_name}</h4>
                  <span className={`status-badge ${product.isListed ? 'listed' : 'pending'}`}>
                    {product.isListed ? '✅ Listed' : '⏳ Pending'}
                  </span>
                </div>
                <p><strong>Variety:</strong> {product.variety || 'N/A'}</p>
                <p><strong>Quantity:</strong> {product.estimated_quantity || product.quantity || 'N/A'} kg</p>
                {product.listing && <p><strong>Listed Quantity:</strong> {product.listing.quantity} {product.listing.quantity_unit}</p>}
                {product.grade && <p><strong>Grade:</strong> {product.grade}</p>}
                {product.listing && <p><strong>Listing Grade:</strong> {product.listing.grade}</p>}
                {product.listing && <p><strong>Listing Status:</strong> {product.listing.status === 'available' ? '🟢 Available' : '🟠 ' + product.listing.status}</p>}
                {product.price && <p><strong>Price:</strong> ₹{product.price}/kg</p>}
                <p><strong>Expected Harvest:</strong> {product.expected_harvest_date ? new Date(product.expected_harvest_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}</p>
                {product.isListed && <p style={{ color: '#888', fontSize: '0.9em', marginTop: '8px' }}>📌 This product is listed and cannot be modified</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const AddProductForm = ({ farmer, resumingCrop, onSuccess, onCancel }) => {
  // Determine starting step based on if we're resuming a crop
  const getStartingStep = () => {
    if (!resumingCrop) return 1;
    // Check if already listed - if so, can't resume
    if (resumingCrop.isListed) {
      console.log('🚫 Cannot resume - product already listed');
      return 5; // Show completed state
    }
    // Check what data already exists for this crop
    if (resumingCrop.grade) return 5; // Already graded, go to listing
    // TODO: Check for image/IoT certs to set appropriate step
    return 2; // Start from image analysis
  };
  
  const [step, setStep] = useState(getStartingStep()); // 1: Create Crop, 2: Upload Image, 3: IoT Data, 4: Grade, 5: List
  const [cropData, setCropData] = useState({
    cropType: 'Grapes',
    variety: resumingCrop?.variety || 'Common',
    plantingDate: resumingCrop?.planting_date ? resumingCrop.planting_date.split('T')[0] : new Date().toISOString().split('T')[0],
    expectedHarvestDate: resumingCrop?.expected_harvest_date ? resumingCrop.expected_harvest_date.split('T')[0] : new Date(Date.now() + 100 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    estimatedQuantity: resumingCrop?.estimated_quantity || ''
  });
  const [crop, setCrop] = useState(resumingCrop || null);
  const [imageFile, setImageFile] = useState(null);
  const [imageCertificate, setImageCertificate] = useState(null);
  const [iotData, setIotData] = useState(null);
  const [iotCertificateId, setIotCertificateId] = useState(null);
  const [useManualIoT, setUseManualIoT] = useState(false);
  const [manualIoTData, setManualIoTData] = useState({
    temperature: '',
    humidity: '',
    mq2: '',
    mq4: '',
    mq6: '',
    mq135: '',
    ldr: ''
  });
  const [gradingResult, setGradingResult] = useState(null);
  const [quantity, setQuantity] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreateCrop = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      
      // If resuming, use existing crop
      if (resumingCrop) {
        setCrop(resumingCrop);
        setStep(2);
        return;
      }
      
      const response = await fpoService.createCrop({
        farmerId: farmer.id,
        ...cropData
      });
      setCrop(response.data.crop);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create crop');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e) => {
    e.preventDefault();
    if (!imageFile) {
      setError('Please select an image');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const formData = new FormData();
      formData.append('file', imageFile);
      formData.append('cropId', crop.id);

      const response = await fpoService.analyzeImage(formData);
      setImageCertificate(response.data.certificate);
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to analyze image');
    } finally {
      setLoading(false);
    }
  };

  const handleFetchIoTData = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');

      // Fetch random sample IoT data from the backend
      const response = await apiClient.get('/iot/sample-data', {
        params: { numReadings: 12 } // Get 12 readings (3 hours at 15-min intervals)
      });

      // Extract averages and quality from response
      const sampleData = response.data;
      
      setIotData({
        avg_temperature: sampleData.averages.temperature,
        avg_humidity: sampleData.averages.humidity,
        avg_light_intensity: sampleData.averages.ldr,
        avg_mq2: sampleData.averages.mq2,
        avg_mq4: sampleData.averages.mq4,
        avg_mq6: sampleData.averages.mq6,
        avg_mq135: sampleData.averages.mq135,
        reading_count: sampleData.count,
        quality_score: sampleData.quality?.score || 0.95,
        quality_grade: sampleData.quality?.grade || 'A',
        sample_data: sampleData.data
      });

      setStep(4);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch IoT data');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateGrade = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');

      // IoT data is now optional - allow grading with just image data
      const gradePayload = {
        cropId: crop.id,
        imageCertificateId: imageCertificate.id,
        iotCertificateId: iotCertificateId || null  // Can be null
      };

      const response = await fpoService.generateGrade(gradePayload);
      setGradingResult(response.data.gradingResult);
      setStep(5);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate grade');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitManualIoT = async () => {
    try {
      setLoading(true);
      setError('');

      // Create IoT certificate from manual data
      const iotPayload = {
        crop_id: crop.id,
        sensor_type: 'manual_input',
        temperature: parseFloat(manualIoTData.temperature) || 0,
        humidity: parseFloat(manualIoTData.humidity) || 0,
        mq2_value: parseFloat(manualIoTData.mq2) || 0,
        mq4_value: parseFloat(manualIoTData.mq4) || 0,
        mq6_value: parseFloat(manualIoTData.mq6) || 0,
        mq135_value: parseFloat(manualIoTData.mq135) || 0,
        ldr_light_level: parseFloat(manualIoTData.ldr) || 0,
        environmental_quality_score: 0.85,
        grade: 'A'
      };

      // Store in database via API or directly
      // For now, we'll create it via a separate endpoint
      const response = await apiClient.post('/fpo/create-iot-certificate', iotPayload);
      setIotCertificateId(response.data.certificateId);
      setUseManualIoT(false);
      setError('');
    } catch (err) {
      setError('Failed to save IoT data. You can proceed without it.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateListing = async (e) => {
    e.preventDefault();
    if (!quantity) {
      setError('Please enter quantity');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const response = await fpoService.createListing({
        cropId: crop.id,
        quantity: parseFloat(quantity)
      });

      alert('Product listed successfully!');
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create listing');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-product-form">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ margin: 0 }}>📝 Quality Verification Workflow</h3>
        {onCancel && (
          <button 
            type="button"
            className="btn btn-secondary"
            onClick={onCancel}
            style={{ padding: '8px 16px', fontSize: '14px' }}
          >
            ✕ Close
          </button>
        )}
      </div>

      {resumingCrop && (
        <div className="resume-banner">
          <p>📋 Resuming quality verification for <strong>{resumingCrop.crop_type}</strong> ({resumingCrop.variety})</p>
        </div>
      )}
      
      <div className="form-steps">
        <div className={`step ${step >= 1 ? 'active' : ''}`}>1. Crop</div>
        <div className={`step ${step >= 2 ? 'active' : ''}`}>2. Image</div>
        <div className={`step ${step >= 3 ? 'active' : ''}`}>3. IoT</div>
        <div className={`step ${step >= 4 ? 'active' : ''}`}>4. Grade</div>
        <div className={`step ${step >= 5 ? 'active' : ''}`}>5. List</div>
      </div>

      {error && <div className="error-message">{error}</div>}
      
      {resumingCrop && step === 1 && (
        <div style={{ padding: '20px', backgroundColor: '#f0f9ff', borderRadius: '5px', marginBottom: '20px' }}>
          <p>✅ Crop already created. Click <strong>Continue →</strong> to proceed with quality verification.</p>
          <button 
            type="button" 
            className="btn btn-primary"
            onClick={() => setStep(2)}
          >
            Continue →
          </button>
          {onCancel && (
            <button 
              type="button" 
              className="btn btn-secondary"
              onClick={onCancel}
              style={{ marginLeft: '10px' }}
            >
              Cancel
            </button>
          )}
        </div>
      )}

      {step === 1 && !resumingCrop && (
        <form onSubmit={handleCreateCrop}>
          <h4>Create Crop Record</h4>
          <div className="form-group">
            <label>Crop Type</label>
            <input
              type="text"
              value={cropData.cropType}
              disabled
              className="input-disabled"
            />
          </div>
          <div className="form-group">
            <label>Variety</label>
            <input
              type="text"
              value={cropData.variety}
              onChange={(e) => setCropData({...cropData, variety: e.target.value})}
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Planting Date</label>
              <input
                type="date"
                value={cropData.plantingDate}
                onChange={(e) => setCropData({...cropData, plantingDate: e.target.value})}
              />
            </div>
            <div className="form-group">
              <label>Expected Harvest</label>
              <input
                type="date"
                value={cropData.expectedHarvestDate}
                onChange={(e) => setCropData({...cropData, expectedHarvestDate: e.target.value})}
              />
            </div>
          </div>
          <div className="form-group">
            <label>Estimated Quantity (kg)</label>
            <input
              type="number"
              value={cropData.estimatedQuantity}
              onChange={(e) => setCropData({...cropData, estimatedQuantity: e.target.value})}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Creating...' : 'Create Crop →'}
          </button>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handleImageUpload}>
          <h4>Upload Grape Image for Quality Analysis</h4>
          <div className="form-group">
            <label>Select Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files[0])}
              required
            />
          </div>
          <p className="help-text">The image will be analyzed by YOLOv3 to detect grape quality and damage</p>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Analyzing...' : 'Analyze Image →'}
          </button>
        </form>
      )}

      {step === 3 && (
        <div>
          {!useManualIoT ? (
            <form onSubmit={handleFetchIoTData}>
              <h4>IoT Sensor Data</h4>
              <p className="help-text">Fetch IoT sensor readings (temperature, humidity, gases, light)</p>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Fetching...' : 'Fetch IoT Data →'}
              </button>
              
              <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f0f9ff', borderRadius: '5px' }}>
                <p className="help-text">Or manually enter IoT sensor readings</p>
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setUseManualIoT(true)}
                >
                  📋 Enter Manual IoT Data
                </button>
              </div>

              <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#fff3cd', borderRadius: '5px' }}>
                <p className="help-text">💡 Note: IoT data is optional. You can generate a grade with just image analysis.</p>
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setStep(4)}
                >
                  Skip IoT & Continue →
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); handleSubmitManualIoT(); }}>
              <h4>Enter Manual IoT Sensor Data</h4>
              <div className="form-row">
                <div className="form-group">
                  <label>Temperature (°C)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={manualIoTData.temperature}
                    onChange={(e) => setManualIoTData({...manualIoTData, temperature: e.target.value})}
                    placeholder="e.g., 28.5"
                  />
                </div>
                <div className="form-group">
                  <label>Humidity (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={manualIoTData.humidity}
                    onChange={(e) => setManualIoTData({...manualIoTData, humidity: e.target.value})}
                    placeholder="e.g., 65"
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>MQ2 Value</label>
                  <input
                    type="number"
                    step="0.1"
                    value={manualIoTData.mq2}
                    onChange={(e) => setManualIoTData({...manualIoTData, mq2: e.target.value})}
                    placeholder="e.g., 150"
                  />
                </div>
                <div className="form-group">
                  <label>MQ4 Value</label>
                  <input
                    type="number"
                    step="0.1"
                    value={manualIoTData.mq4}
                    onChange={(e) => setManualIoTData({...manualIoTData, mq4: e.target.value})}
                    placeholder="e.g., 120"
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>MQ6 Value</label>
                  <input
                    type="number"
                    step="0.1"
                    value={manualIoTData.mq6}
                    onChange={(e) => setManualIoTData({...manualIoTData, mq6: e.target.value})}
                    placeholder="e.g., 100"
                  />
                </div>
                <div className="form-group">
                  <label>Light Level (lux)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={manualIoTData.ldr}
                    onChange={(e) => setManualIoTData({...manualIoTData, ldr: e.target.value})}
                    placeholder="e.g., 450"
                  />
                </div>
              </div>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Saving...' : 'Save IoT Data →'}
              </button>
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={() => setUseManualIoT(false)}
                style={{ marginLeft: '10px' }}
              >
                Cancel
              </button>
            </form>
          )}
        </div>
      )}

      {step === 4 && (
        <form onSubmit={handleGenerateGrade}>
          <h4>Generate Quality Grade</h4>
          <div className="analysis-summary">
            <h5>Image Analysis Results:</h5>
            {imageCertificate && (
              <>
                <p><strong>Overall Score:</strong> {imageCertificate.overall_quality_score}%</p>
                <p><strong>Grade:</strong> {imageCertificate.grade}</p>
                <p><strong>Spoilage:</strong> {imageCertificate.spoilage_percentage}%</p>
              </>
            )}
            
            <h5 style={{marginTop: '15px'}}>IoT Sensor Data:</h5>
            {iotData && (
              <>
                <p><strong>Avg Temperature:</strong> {iotData.avg_temperature !== null ? iotData.avg_temperature + '°C' : 'No data'}</p>
                <p><strong>Avg Humidity:</strong> {iotData.avg_humidity !== null ? iotData.avg_humidity + '%' : 'No data'}</p>
                <p><strong>Avg Light:</strong> {iotData.avg_light_intensity !== null ? iotData.avg_light_intensity + ' lux' : 'No data'}</p>
                <p><strong>Readings Count:</strong> {iotData.reading_count || 0}</p>
                <p><strong>Devices:</strong> {iotData.devices_count || 0}</p>
              </>
            )}
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Generating...' : 'Generate Grade →'}
          </button>
        </form>
      )}

      {step === 5 && (
        <form onSubmit={handleCreateListing}>
          <h4>List Product for Sale</h4>
          <div className="grading-result" style={{backgroundColor: '#f0f9ff', padding: '15px', borderRadius: '5px', marginBottom: '15px'}}>
            {gradingResult && (
              <>
                <p><strong>Final Grade:</strong> <span style={{fontSize: '18px', color: '#2ecc71'}}>{gradingResult.finalGrade}</span></p>
                <p><strong>Quality Score:</strong> {(gradingResult.finalScore * 100).toFixed(1)}%</p>
                <p><strong>Image Grade:</strong> {gradingResult.imageGrade}</p>
                {gradingResult.iotGrade && <p><strong>IoT Grade:</strong> {gradingResult.iotGrade}</p>}
                <p><strong>Certificate ID:</strong> {gradingResult.gradingResultId?.slice(0, 12) || 'N/A'}...</p>
              </>
            )}
          </div>

          <div className="form-group">
            <label>Quantity to List (kg) *</label>
            <input
              type="number"
              step="0.1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Enter quantity"
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Listing...' : 'List Product ✓'}
          </button>
        </form>
      )}
    </div>
  );
};

const ProductListings = () => {
  const [products, setProducts] = useState([]);
  const [farmers, setFarmers] = useState({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, listed

  useEffect(() => {
    loadProductsAndFarmers();
  }, [filter]);

  const loadProductsAndFarmers = async () => {
    try {
      setLoading(true);
      
      // Get all crops from FPO
      const cropsResponse = await fpoService.getCropsByFPO();
      let allCrops = cropsResponse.data.crops || [];
      
      // Get farmers
      const farmersResponse = await fpoService.getFarmers();
      const farmerMap = {};
      farmersResponse.data.farmers.forEach(f => {
        farmerMap[f.id] = f;
      });
      setFarmers(farmerMap);

      // Get all product listings
      let listingsMap = {};
      try {
        for (const farmer of Object.values(farmerMap)) {
          try {
            const listingsResponse = await fpoService.getListingsForFarmer(farmer.id);
            listingsResponse.data.listings.forEach(listing => {
              listingsMap[listing.crop_id] = listing;
            });
          } catch (err) {
            console.warn(`Failed to load listings for farmer ${farmer.id}:`, err);
          }
        }
      } catch (err) {
        console.warn('Failed to load listings:', err);
      }

      // Merge crops with their listing status
      let productsWithStatus = allCrops.map(crop => ({
        ...crop,
        listing: listingsMap[crop.id] || null,
        isListed: !!listingsMap[crop.id]
      }));

      // Filter products
      if (filter === 'pending') {
        productsWithStatus = productsWithStatus.filter(p => !p.isListed);
      } else if (filter === 'listed') {
        productsWithStatus = productsWithStatus.filter(p => p.isListed);
      }

      setProducts(productsWithStatus);
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-IN', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  if (loading) return <div className="loading">Loading products...</div>;

  return (
    <div className="product-listings">
      <div className="section-header">
        <h2>🍇 Crop Listings</h2>
        <div className="filter-buttons">
          <button 
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All Products ({products.length})
          </button>
          <button 
            className={`filter-btn ${filter === 'pending' ? 'active' : ''}`}
            onClick={() => setFilter('pending')}
          >
            ⏳ Pending ({products.filter(p => !p.isListed).length})
          </button>
          <button 
            className={`filter-btn ${filter === 'listed' ? 'active' : ''}`}
            onClick={() => setFilter('listed')}
          >
            ✅ Listed ({products.filter(p => p.isListed).length})
          </button>
        </div>
      </div>

      {products.length === 0 ? (
        <div className="empty-state">
          <p>No products {filter !== 'all' ? `in "${filter}" status` : 'yet'}</p>
        </div>
      ) : (
        <div className="crops-grid">
          {products.map((product) => {
            const farmer = farmers[product.farmer_id];
            const statusBadge = product.isListed ? '✅ Listed' : '⏳ Pending';
            const statusClass = product.isListed ? 'listed' : 'pending';
            
            return (
              <div key={product.id} className="crop-card">
                <div className="crop-header">
                  <span className="crop-type">🍇 {product.crop_type}</span>
                  <span className={`status-badge ${statusClass}`}>
                    {statusBadge}
                  </span>
                </div>
                
                <div className="crop-details">
                  <div className="detail-row">
                    <span className="label">Farmer:</span>
                    <span className="value">{farmer?.farmer_name || 'Unknown'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Variety:</span>
                    <span className="value">{product.variety || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Quantity:</span>
                    <span className="value">{product.estimated_quantity || 0} {product.quantity_unit || 'kg'}</span>
                  </div>
                  {product.listing && (
                    <div className="detail-row">
                      <span className="label">Listed Qty:</span>
                      <span className="value">{product.listing.quantity} {product.listing.quantity_unit}</span>
                    </div>
                  )}
                  <div className="detail-row">
                    <span className="label">📅 Expected Harvest:</span>
                    <span className="value harvest-date">{formatDate(product.expected_harvest_date)}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">📍 Location:</span>
                    <span className="value">{farmer?.plot_location || 'N/A'}</span>
                  </div>
                  {product.listing && (
                    <>
                      <div className="detail-row">
                        <span className="label">Grade:</span>
                        <span className="value">{product.listing.grade}</span>
                      </div>
                      <div className="detail-row">
                        <span className="label">Listing Status:</span>
                        <span className="value">{product.listing.status === 'available' ? '🟢 Available' : '🟠 ' + product.listing.status}</span>
                      </div>
                      <div className="detail-row">
                        <span className="label">Listed on:</span>
                        <span className="value">{formatDate(product.listing.created_at)}</span>
                      </div>
                    </>
                  )}
                </div>

                <div className="crop-footer">
                  {product.isListed ? (
                    <span className="status-text available">Marketplace Listed ✓</span>
                  ) : (
                    <span className="status-text pending">Awaiting Quality Verification</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export const FarmerPayments = () => {
  const [payments, setPayments] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    farmer_id: '',
    amount: '',
    payment_method: 'bank_transfer',
    description: ''
  });
  const [farmers, setFarmers] = useState([]);

  useEffect(() => {
    loadPaymentsAndFarmers();
  }, []);

  const loadPaymentsAndFarmers = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Load farmers
      const farmersResponse = await fpoService.getFarmers();
      setFarmers(farmersResponse.data.farmers || []);
      
      // Load payments with summary
      const paymentsResponse = await fpoService.getPayments?.() || { data: { payments: [], summary: null } };
      setPayments(paymentsResponse.data.payments || []);
      setSummary(paymentsResponse.data.summary || null);
      console.log('📊 [PAYMENTS] Summary:', paymentsResponse.data.summary);
    } catch (error) {
      console.error('Failed to load payments:', error);
      setPayments([]);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.farmer_id || !formData.amount) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      await fpoService.createPayment?.(formData);
      setFormData({
        farmer_id: '',
        amount: '',
        payment_method: 'bank_transfer',
        description: ''
      });
      setShowForm(false);
      await loadPaymentsAndFarmers();
    } catch (error) {
      console.error('Failed to create payment:', error);
      setError('Failed to create payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getFilteredPayments = () => {
    if (filter === 'all') return payments;
    return payments.filter(p => p.status === filter);
  };

  const handleMarkAsPaid = async (paymentId) => {
    if (!window.confirm('Mark this payment as paid to the farmer?')) return;
    
    try {
      setLoading(true);
      await fpoService.markPaymentPaid?.(paymentId);
      alert('✅ Payment marked as paid!');
      await loadPaymentsAndFarmers();
    } catch (error) {
      console.error('Failed to mark payment:', error);
      setError('Failed to mark payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filteredPayments = getFilteredPayments();
  const totalAmount = filteredPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const pendingAmount = payments
    .filter(p => p.status === 'pending')
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-IN', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  if (loading && payments.length === 0) {
    return <div className="loading">Loading payments...</div>;
  }

  return (
    <div className="farmer-payments">
      <div className="section-header">
        <h2>💰 Farmer Payments</h2>
        <button 
          className="btn btn-primary"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? '✕ Cancel' : '+ New Payment'}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {showForm && (
        <form onSubmit={handleSubmit} className="payment-form">
          <h3>Record Payment</h3>
          <div className="form-group">
            <label>Farmer *</label>
            <select
              value={formData.farmer_id}
              onChange={(e) => setFormData({...formData, farmer_id: e.target.value})}
              required
            >
              <option value="">Select a farmer</option>
              {farmers.map(farmer => (
                <option key={farmer.id} value={farmer.id}>
                  {farmer.farmer_name} (ID: {farmer.id})
                </option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Amount (₹) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={(e) => setFormData({...formData, amount: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label>Payment Method</label>
              <select
                value={formData.payment_method}
                onChange={(e) => setFormData({...formData, payment_method: e.target.value})}
              >
                <option value="bank_transfer">Bank Transfer</option>
                <option value="cash">Cash</option>
                <option value="cheque">Cheque</option>
                <option value="upi">UPI</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="e.g., Payment for grape harvest"
              rows="3"
            ></textarea>
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Recording...' : 'Record Payment'}
          </button>
        </form>
      )}

      <div className="stats-grid" style={{ marginBottom: '20px' }}>
        <div className="stat-card">
          <h4>Total Payments</h4>
          <p className="stat-value">₹{(summary?.total_payments || 0).toLocaleString('en-IN', {minimumFractionDigits: 2})}</p>
          <p className="stat-label">{summary?.total_transactions || 0} transactions</p>
        </div>
        <div className="stat-card">
          <h4>Pending Payments</h4>
          <p className="stat-value" style={{ color: '#ff9800' }}>₹{(summary?.pending_payments || 0).toLocaleString('en-IN', {minimumFractionDigits: 2})}</p>
          <p className="stat-label">{summary?.pending_count || 0} pending</p>
        </div>
        <div className="stat-card">
          <h4>Completed</h4>
          <p className="stat-value" style={{ color: '#4caf50' }}>₹{(summary?.completed_payments || 0).toLocaleString('en-IN', {minimumFractionDigits: 2})}</p>
          <p className="stat-label">{summary?.completed_count || 0} completed</p>
        </div>
      </div>

      <div className="section-header">
        <div className="filter-buttons">
          <button 
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All Payments ({payments.length})
          </button>
          <button 
            className={`filter-btn ${filter === 'pending' ? 'active' : ''}`}
            onClick={() => setFilter('pending')}
          >
            ⏳ Pending ({payments.filter(p => p.status === 'pending').length})
          </button>
        </div>
      </div>

      {filteredPayments.length === 0 ? (
        <div className="empty-state">
          <p>No payments {filter !== 'all' ? `in "${filter}" status` : 'yet'}</p>
        </div>
      ) : (
        <table className="payments-table">
          <thead>
            <tr>
              <th>Farmer</th>
              <th>Crop</th>
              <th>Qty (kg)</th>
              <th>Amount</th>
              <th>Purchase Date</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredPayments.map(payment => {
              const farmer = farmers.find(f => f.id === payment.farmer_id);
              const statusBadge = payment.status === 'pending' ? '⏳' : '✅';
              const statusClass = payment.status === 'pending' ? 'pending' : 'paid';
              
              return (
                <tr key={payment.id} className={`payment-row ${statusClass}`}>
                  <td><strong>{farmer?.farmer_name || 'Unknown'}</strong><br/><small>{farmer?.phone || '-'}</small></td>
                  <td>{payment.crop_type} Grade {payment.grade}</td>
                  <td>{payment.purchase_quantity} kg</td>
                  <td className="amount">₹{(payment.amount || 0).toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                  <td>{new Date(payment.created_at).toLocaleDateString()}</td>
                  <td><span className={`status-badge ${statusClass}`}>{statusBadge} {payment.status}</span></td>
                  <td>
                    {payment.status === 'pending' && (
                      <button 
                        className="btn btn-sm btn-success"
                        onClick={() => handleMarkAsPaid(payment.id)}
                        title="Mark payment as paid to farmer"
                      >
                        💳 Pay
                      </button>
                    )}
                    {payment.status === 'paid' && (
                      <span className="text-success">Paid ✓</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
};
