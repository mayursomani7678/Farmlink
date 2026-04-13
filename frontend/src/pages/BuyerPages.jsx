import React, { useState, useEffect } from 'react';
import { buyerService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import MandiPriceDashboard from '../components/MandiPriceDashboard';
import { BuyerPurchases } from './BuyerPurchases';
import '../styles/BuyerMarketplace.css';

export const BuyerDashboard = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('marketplace'); // marketplace, purchases, mandi
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWallet();
  }, []);

  const loadWallet = async () => {
    try {
      const response = await buyerService.getWallet?.();
      if (response?.data?.wallet) {
        setWallet(response.data.wallet);
      }
    } catch (error) {
      console.error('Failed to load wallet:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  return (
    <div className="buyer-dashboard">
      <div className="dashboard-header">
        <h1>🛍️ Buyer Portal</h1>
        <div className="header-actions">
          <div className="wallet-info">
            {!loading && wallet && (
              <>
                <span className="balance-label">💰 Balance:</span>
                <span className="balance-amount">₹{(wallet.balance || 0).toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
              </>
            )}
          </div>
          <span className="user-info">👤 {user?.fullName || user?.email}</span>
          <button className="btn btn-logout" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>

      <div className="dashboard-tabs">
        <button 
          className={`tab-btn ${activeTab === 'marketplace' ? 'active' : ''}`}
          onClick={() => setActiveTab('marketplace')}
        >
          Marketplace
        </button>
        <button 
          className={`tab-btn ${activeTab === 'purchases' ? 'active' : ''}`}
          onClick={() => setActiveTab('purchases')}
        >
          🛍️ My Purchases
        </button>
        <button 
          className={`tab-btn ${activeTab === 'mandi' ? 'active' : ''}`}
          onClick={() => setActiveTab('mandi')}
        >
          📊 Mandi Prices
        </button>
      </div>

      {activeTab === 'marketplace' && <BuyerMarketplace />}
      {activeTab === 'purchases' && <BuyerPurchases />}
      {activeTab === 'mandi' && <MandiPriceDashboard />}
    </div>
  );
};

export const BuyerMarketplace = () => {
  const [listings, setListings] = useState([]);
  const [filters, setFilters] = useState({ grade: '', minQuantity: '', cropType: '' });
  const [loading, setLoading] = useState(true);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [selectedListing, setSelectedListing] = useState(null);
  const [quantity, setQuantity] = useState('');
  const [purchasing, setPurchasing] = useState(false);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    loadListings();
    // Auto-reload listings every 5 seconds to show dynamic updates
    const interval = setInterval(loadListings, 5000);
    return () => clearInterval(interval);
  }, [filters]);

  const loadListings = async () => {
    setLoading(true);
    try {
      const response = await buyerService.getMarketplace(filters);
      console.log('📦 [MARKETPLACE] Loaded aggregated listings:', response.data.listings);
      
      // API now returns { verified: [...], pending: [...] }
      const listingsData = response.data.listings;
      
      // Combine verified and pending listings into a single array
      const allListings = [
        ...(Array.isArray(listingsData.verified) ? listingsData.verified : []),
        ...(Array.isArray(listingsData.pending) ? listingsData.pending : [])
      ];
      
      setListings(allListings);
    } catch (error) {
      console.error('Failed to load listings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleBuyClick = (listing) => {
    setSelectedListing(listing);
    setQuantity('');
    setShowBuyModal(true);
  };

  const handlePurchase = async () => {
    if (!quantity || quantity <= 0) {
      alert('Please enter valid quantity');
      return;
    }

    try {
      setPurchasing(true);
      console.log('💳 [PURCHASE] Starting purchase for:', selectedListing.crop_type, selectedListing.grade, 'Quantity:', quantity);
      
      const { paymentService } = await import('../services/api');
      
      console.log('📤 [PURCHASE] Sending purchase request...');
      // Send crop type and grade - backend will find an available listing
      const response = await paymentService.createPurchase({
        cropType: selectedListing.crop_type,
        grade: selectedListing.grade,
        quantity: parseFloat(quantity)
      });
      
      console.log('✅ [PURCHASE] Purchase successful! Response:', response.data);
      alert('✅ Purchase created! Payment held in escrow.');
      setShowBuyModal(false);
      loadListings();
    } catch (error) {
      console.error('❌ [PURCHASE] Purchase failed:', {
        status: error.response?.status,
        error: error.response?.data?.error,
        message: error.message,
        code: error.code
      });
      
      // Better error messages
      let errorMsg = 'Purchase failed';
      let detailedMsg = '';
      
      console.error('🔴 Purchase Error Details:', {
        code: error.code,
        message: error.message,
        status: error.response?.status,
        responseData: error.response?.data,
        requestUrl: error.config?.url
      });
      
      if (error.code === 'ECONNREFUSED') {
        errorMsg = '🌐 Network Error: Cannot connect to server';
        detailedMsg = 'Is the backend running on port 5000?';
      } else if (error.code === 'ENOTFOUND') {
        errorMsg = '🌐 Network Error: Cannot reach server';
        detailedMsg = 'Check your internet connection';
      } else if (error.message === 'timeout of 30000ms exceeded') {
        errorMsg = '⏱️ Request Timeout: Server is too slow';
        detailedMsg = 'Try again in a moment';
      } else if (error.response?.status === 500) {
        errorMsg = '❌ Server Error';
        detailedMsg = error.response?.data?.details || 'Internal server error';
      } else if (error.response?.data?.error) {
        errorMsg = error.response.data.error;
        detailedMsg = error.response?.data?.details || '';
      } else if (error.response?.status === 404) {
        errorMsg = '❌ Not Found';
        detailedMsg = error.response?.data?.error || 'Resource not found';
      } else if (error.response?.status === 400) {
        errorMsg = '❌ Invalid Request';
        detailedMsg = error.response?.data?.error || 'Bad request';
      } else if (error.message) {
        errorMsg = error.message;
      }
      
      const fullMessage = detailedMsg ? `${errorMsg}\n\nDetails: ${detailedMsg}` : errorMsg;
      alert(fullMessage);
    } finally {
      setPurchasing(false);
    }
  };

  if (loading) return <div className="loading">Loading marketplace...</div>;

  return (
    <div className="buyer-marketplace">
      <h1>🌐 Marketplace - Premium Produce</h1>

      <div className="filters">
        <select name="grade" value={filters.grade} onChange={handleFilterChange}>
          <option value="">All Grades</option>
          <option value="A">Grade A (₹55/kg)</option>
          <option value="B">Grade B (₹30/kg)</option>
          <option value="C">Grade C (₹15/kg)</option>
        </select>

        <input
          type="number"
          name="minQuantity"
          placeholder="Min Quantity (kg)"
          value={filters.minQuantity}
          onChange={handleFilterChange}
        />

        <select name="cropType" value={filters.cropType} onChange={handleFilterChange}>
          <option value="">All Crops</option>
          <option value="grapes">Grapes</option>
          <option value="tomato">Tomato</option>
          <option value="potato">Potato</option>
        </select>
      </div>

      {listings.length === 0 ? (
        <div className="empty-state">
          <p>No products available</p>
        </div>
      ) : (
        <div className="listings-grid">
          {listings.map((listing, idx) => (
            <div key={`${listing.crop_type}-${listing.grade}-${idx}`} className="listing-card">
              <div className="grade-badge">{listing.grade}</div>
              <h3>🍇 {listing.crop_type}</h3>
              <p className="aggregated-badge">📦 {listing.listing_count} {listing.listing_count === 1 ? 'listing' : 'listings'}</p>
              <p><strong>Available:</strong> {listing.quantity} kg</p>
              <p className="farmers"><strong>Farmers:</strong> {listing.farmer_names}</p>
              <p className="fpos"><strong>FPOs:</strong> {listing.fpo_names}</p>
              <p><strong>Quality Score:</strong> {(listing.avg_score * 100).toFixed(1)}%</p>
              <div className="card-footer">
                <button 
                  className="btn btn-primary"
                  onClick={() => handleBuyClick(listing)}
                >
                  💳 Buy Now
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showBuyModal && selectedListing && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>🛍️ Purchase {selectedListing.crop_type}</h2>
              <button className="close-btn" onClick={() => setShowBuyModal(false)}>✕</button>
            </div>

            <div className="modal-body">
              <div className="product-summary">
                <p><strong>Crop:</strong> {selectedListing.crop_type}</p>
                <p><strong>Grade:</strong> {selectedListing.grade}</p>
                <p><strong>Available Quantity:</strong> {selectedListing.quantity} kg</p>
                <p><strong>From {selectedListing.listing_count} {selectedListing.listing_count === 1 ? 'listing' : 'listings'}:</strong></p>
                <p style={{fontSize: '12px', color: '#666'}}>👨‍🌾 {selectedListing.farmer_names}</p>
                <p style={{fontSize: '12px', color: '#666'}}>🏢 {selectedListing.fpo_names}</p>
                <p><strong>Avg Quality Score:</strong> {(selectedListing.avg_score * 100).toFixed(1)}%</p>
              </div>

              <div className="purchase-form">
                <label>Quantity (kg) *</label>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="Enter quantity"
                  min="0"
                  max={selectedListing.quantity}
                  step="0.1"
                />

                {quantity && (
                  <div className="price-breakdown">
                    <p><strong>Grade Price:</strong> ₹{selectedListing.grade === 'A' ? '55' : selectedListing.grade === 'B' ? '30' : '15'}/kg</p>
                    <p><strong>Total Amount:</strong> ₹{(
                      quantity * (selectedListing.grade === 'A' ? 55 : selectedListing.grade === 'B' ? 30 : 15)
                    ).toLocaleString('en-IN', {minimumFractionDigits: 2})}</p>
                    <p style={{color: '#666', fontSize: '12px'}}>💰 Payment will be held in escrow until delivery confirmation</p>
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button 
                className="btn btn-secondary"
                onClick={() => setShowBuyModal(false)}
                disabled={purchasing}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary"
                onClick={handlePurchase}
                disabled={!quantity || purchasing}
              >
                {purchasing ? '⏳ Processing...' : '✅ Confirm Purchase'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const ProductDetails = ({ listingId }) => {
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    loadDetails();
  }, [listingId]);

  const loadDetails = async () => {
    try {
      const response = await buyerService.getListingDetails(listingId);
      setListing(response.data.listing);
    } catch (error) {
      console.error('Failed to load details:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (!listing) return <div>Listing not found</div>;

  return (
    <div className="product-details">
      <h1>{listing.crop_type} - Grade {listing.final_grade}</h1>

      <div className="details-grid">
        <div className="section">
          <h2>Product Info</h2>
          <p><strong>Quantity:</strong> {listing.quantity} kg</p>
          <p><strong>Grade:</strong> {listing.final_grade}</p>
          <p><strong>Quality Score:</strong> {(listing.final_score * 100).toFixed(1)}%</p>
        </div>

        <div className="section">
          <h2>Image Quality Certificate</h2>
          <p><strong>Spoilage:</strong> {listing.spoilage_percentage}%</p>
          <p><strong>Freshness:</strong> {(listing.freshness_score * 100).toFixed(1)}%</p>
          <p><strong>Overall Quality:</strong> {(listing.image_quality * 100).toFixed(1)}%</p>
        </div>

        <div className="section">
          <h2>IoT Environmental Data</h2>
          <p><strong>Temperature:</strong> {listing.temperature}°C</p>
          <p><strong>Humidity:</strong> {listing.humidity}%</p>
          <p><strong>Light Level:</strong> {listing.ldr_light_level}</p>
          <p><strong>Environmental Quality:</strong> {(listing.iot_quality * 100).toFixed(1)}%</p>
        </div>

        <div className="section">
          <h2>Farmer Info</h2>
          <p><strong>Name:</strong> {listing.farmer_name}</p>
          <p><strong>Location:</strong> {listing.plot_location}</p>
          <p><strong>FPO:</strong> {listing.fpo_name}</p>
        </div>
      </div>

      <button className="btn btn-primary btn-large">Buy This Product</button>
    </div>
  );
};
