import React, { useState, useEffect } from 'react';
import { buyerService, mandiService, fpoService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import '../styles/Dashboard.css';

export const Dashboard = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [mandiPrices, setMandiPrices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('transactions');
  const [refreshInterval, setRefreshInterval] = useState(30); // seconds
  const [stats, setStats] = useState({
    totalTransactions: 0,
    totalValue: 0,
    avgPrice: 0,
    lastUpdate: new Date()
  });

  // Fetch transactions
  const loadTransactions = async () => {
    try {
      const response = await buyerService.getTransactionHistory();
      if (response?.data?.transactions) {
        setTransactions(response.data.transactions);
        
        // Calculate stats
        const total = response.data.transactions.length;
        const value = response.data.transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
        setStats({
          totalTransactions: total,
          totalValue: value,
          avgPrice: total > 0 ? (value / total).toFixed(2) : 0,
          lastUpdate: new Date()
        });
      }
    } catch (err) {
      console.error('Error loading transactions:', err);
      setError('Failed to load transactions');
    }
  };

  // Fetch mandi prices
  const loadMandiPrices = async () => {
    try {
      const response = await mandiService.getAllPrices();
      if (response?.data) {
        // Group prices by commodity for better display
        const grouped = groupByCommodity(response.data);
        setMandiPrices(grouped);
      }
    } catch (err) {
      console.error('Error loading mandi prices:', err);
      // Continue without prices, not critical
    }
  };

  // Group prices by commodity
  const groupByCommodity = (prices) => {
    if (!Array.isArray(prices)) return [];
    
    return prices.slice(0, 20).map(price => ({
      ...price,
      pricePerKg: parseFloat(price.price_per_kg || price.pricePerKg || 0).toFixed(2),
      grade: price.grade || 'N/A',
      mandi: price.mandi_name || price.mandiName || 'Various'
    }));
  };

  // Initial data load
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([loadTransactions(), loadMandiPrices()]);
      setLoading(false);
    };

    loadData();

    // Set up auto-refresh
    const interval = setInterval(() => {
      loadData();
    }, refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [refreshInterval]);

  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(value);
  };

  // Format date
  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get status badge
  const getStatusBadge = (status) => {
    const statusMap = {
      'completed': { color: '#22c55e', icon: '✅' },
      'delivered': { color: '#22c55e', icon: '🚚' },
      'paid': { color: '#22c55e', icon: '💳' },
      'pending': { color: '#f59e0b', icon: '⏳' },
      'processing': { color: '#3b82f6', icon: '🔄' },
      'cancelled': { color: '#ef4444', icon: '❌' }
    };
    
    const statusInfo = statusMap[status?.toLowerCase()] || { color: '#6b7280', icon: '❓' };
    return `${statusInfo.icon} ${status}`;
  };

  return (
    <div className="dashboard-full">
      {/* Header */}
      <div className="dashboard-full-header">
        <div className="header-content">
          <h1>📊 Dashboard</h1>
          <p className="header-subtitle">Welcome, {user?.fullName || user?.email}!</p>
        </div>
        <div className="header-controls">
          <div className="refresh-control">
            <label>🔄 Auto-refresh:</label>
            <select value={refreshInterval} onChange={(e) => setRefreshInterval(Number(e.target.value))}>
              <option value={10}>10 seconds</option>
              <option value={30}>30 seconds</option>
              <option value={60}>1 minute</option>
              <option value={300}>5 minutes</option>
            </select>
          </div>
          <span className="last-update">Last updated: {stats.lastUpdate.toLocaleTimeString('en-IN')}</span>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="dashboard-stats">
        <div className="stat-card total-trans">
          <div className="stat-icon">📋</div>
          <div className="stat-content">
            <p className="stat-label">Total Transactions</p>
            <h3 className="stat-value">{stats.totalTransactions}</h3>
          </div>
        </div>

        <div className="stat-card total-value">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <p className="stat-label">Total Value</p>
            <h3 className="stat-value">{formatCurrency(stats.totalValue)}</h3>
          </div>
        </div>

        <div className="stat-card avg-price">
          <div className="stat-icon">📈</div>
          <div className="stat-content">
            <p className="stat-label">Average Price</p>
            <h3 className="stat-value">{formatCurrency(stats.avgPrice)}</h3>
          </div>
        </div>

        <div className="stat-card commodities">
          <div className="stat-icon">🌾</div>
          <div className="stat-content">
            <p className="stat-label">Active Commodities</p>
            <h3 className="stat-value">{[...new Set(mandiPrices.map(p => p.crop_name))].length}</h3>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="dashboard-tabs">
        <button
          className={`tab-btn ${activeTab === 'transactions' ? 'active' : ''}`}
          onClick={() => setActiveTab('transactions')}
        >
          📊 Transactions
        </button>
        <button
          className={`tab-btn ${activeTab === 'mandi' ? 'active' : ''}`}
          onClick={() => setActiveTab('mandi')}
        >
          🌾 Mandi Rates
        </button>
      </div>

      {/* Content */}
      <div className="dashboard-content">
        {error && <div className="error-banner">⚠️ {error}</div>}

        {/* Transactions Tab */}
        {activeTab === 'transactions' && (
          <div className="tab-content transactions-section">
            <h2>💳 Recent Transactions</h2>
            {loading && transactions.length === 0 ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Loading transactions...</p>
              </div>
            ) : transactions.length > 0 ? (
              <div className="transactions-container">
                <div className="transactions-table-wrapper">
                  <table className="transactions-table">
                    <thead>
                      <tr>
                        <th>📋 ID</th>
                        <th>🌾 Crop</th>
                        <th>⚖️ Quantity</th>
                        <th>💵 Amount</th>
                        <th>📆 Date</th>
                        <th>✅ Status</th>
                        <th>📍 Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.slice(0, 20).map((transaction, index) => (
                        <tr key={transaction.id || index} className="transaction-row">
                          <td className="trans-id">
                            <span className="id-badge">{(index + 1).toString().padStart(2, '0')}</span>
                          </td>
                          <td className="crop-name">
                            <span className="crop-label">{transaction.crop_type || transaction.cropType || 'N/A'}</span>
                            <span className="grade-label">{transaction.grade && ` - ${transaction.grade}`}</span>
                          </td>
                          <td className="quantity">
                            {transaction.quantity || transaction.purchase_quantity || 0} kg
                          </td>
                          <td className="amount">
                            <strong>{formatCurrency(transaction.amount || transaction.total_amount || 0)}</strong>
                          </td>
                          <td className="date">
                            {formatDate(transaction.purchase_date || transaction.created_at)}
                          </td>
                          <td className="status">
                            <span className="status-badge">{getStatusBadge(transaction.status)}</span>
                          </td>
                          <td className="details">
                            <button className="detail-btn" title="View details">👁️</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">📭</div>
                <h3>No transactions yet</h3>
                <p>Your transactions will appear here once you make a purchase</p>
              </div>
            )}
          </div>
        )}

        {/* Mandi Rates Tab */}
        {activeTab === 'mandi' && (
          <div className="tab-content mandi-section">
            <h2>🌾 Current Mandi Rates</h2>
            {loading && mandiPrices.length === 0 ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Loading mandi prices...</p>
              </div>
            ) : mandiPrices.length > 0 ? (
              <div className="mandi-container">
                <div className="mandi-grid">
                  {mandiPrices.map((price, index) => (
                    <div key={index} className="mandi-card">
                      <div className="mandi-card-header">
                        <h3 className="commodity-name">
                          🌾 {price.crop_name || price.cropName || 'Unknown'}
                        </h3>
                        <span className={`grade-badge grade-${price.grade || 'N'}`}>
                          Grade: {price.grade || 'N/A'}
                        </span>
                      </div>

                      <div className="mandi-card-body">
                        <div className="price-row">
                          <span className="price-label">💰 Price /kg:</span>
                          <span className="price-value">₹{price.pricePerKg}</span>
                        </div>
                        <div className="mandi-row">
                          <span className="mandi-label">📍 Mandi:</span>
                          <span className="mandi-value">{price.mandi}</span>
                        </div>
                        <div className="state-row">
                          <span className="state-label">🗺️ State:</span>
                          <span className="state-value">{price.state || price.State || 'N/A'}</span>
                        </div>
                      </div>

                      <div className="mandi-card-footer">
                        <div className="trend-indicator">
                          <span className="trend-icon">📊</span>
                          <span className="trend-text">Live Rate</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">📭</div>
                <h3>No mandi rates available</h3>
                <p>Mandi price data is currently unavailable</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="dashboard-footer">
        <p>💡 Data updates automatically every {refreshInterval} seconds</p>
        <p>All prices are in Indian Rupees (INR) per kilogram</p>
      </div>
    </div>
  );
};

export default Dashboard;
