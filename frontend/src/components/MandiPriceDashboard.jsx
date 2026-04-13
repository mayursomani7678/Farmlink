import React, { useState, useEffect } from 'react';
import { mandiService } from '../services/api';
import '../styles/MandiPriceDashboard.css';

export const MandiPriceDashboard = () => {
  const [prices, setPrices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const pricesRes = await mandiService.getAllPrices();
      setPrices(pricesRes.data.prices || []);
    } catch (error) {
      console.error('Failed to load mandi data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSortedPrices = () => {
    return prices;
  };

  const getSupplyStatusColor = (status) => {
    switch (status) {
      case 'surplus':
        return '#55efc4';
      case 'scarcity':
        return '#ff7675';
      default:
        return '#74b9ff';
    }
  };

  const getSupplyStatusLabel = (status) => {
    switch (status) {
      case 'surplus':
        return '↑ Surplus';
      case 'scarcity':
        return '↓ Scarcity';
      default:
        return '= Normal';
    }
  };

  if (loading && prices.length === 0) {
    return <div className="loading">Loading mandi prices...</div>;
  }

  const sortedPrices = getSortedPrices();

  return (
    <div className="mandi-dashboard">
      <div className="dashboard-header">
        <h2>📊 Live Mandi Price Dashboard</h2>
        <p className="subtitle">Real-time vegetable and fruit prices across Indian mandis</p>
      </div>

      {sortedPrices.length === 0 ? (
        <div className="empty-state">
          <p>No prices available for selected filters</p>
        </div>
      ) : (
        <div className="prices-container">
          <div className="prices-grid">
            {sortedPrices.map((price, idx) => (
              <div key={idx} className="price-card">
                <div className="card-header">
                  <h3>{price.commodity_name}</h3>
                  <span 
                    className="supply-badge"
                    style={{ backgroundColor: getSupplyStatusColor(price.supply_status) }}
                  >
                    {getSupplyStatusLabel(price.supply_status)}
                  </span>
                </div>

                <div className="card-content">
                  <div className="price-main">
                    <span className="price-value">₹{price.price_per_unit}</span>
                    <span className="price-unit">per {price.unit}</span>
                  </div>

                  <div className="card-details">
                    <div className="detail-row">
                      <span className="label">Variety:</span>
                      <span className="value">{price.variety || 'N/A'}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Grade:</span>
                      <span className="value">{price.grade}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Mandi:</span>
                      <span className="value">{price.mandi_name}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">State:</span>
                      <span className="value">{price.state}</span>
                    </div>
                    {price.min_price && price.max_price && (
                      <div className="detail-row">
                        <span className="label">Range:</span>
                        <span className="value">
                          ₹{price.min_price} - ₹{price.max_price}
                        </span>
                      </div>
                    )}
                    {price.avg_price && (
                      <div className="detail-row">
                        <span className="label">Avg:</span>
                        <span className="value">₹{price.avg_price}</span>
                      </div>
                    )}
                    <div className="detail-row timestamp">
                      <span className="label">Updated:</span>
                      <span className="value">
                        {new Date(price.timestamp).toLocaleTimeString('en-IN', 
                          { hour: '2-digit', minute: '2-digit', hour12: true }
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MandiPriceDashboard;
