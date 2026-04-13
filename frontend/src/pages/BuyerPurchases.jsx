import React, { useState, useEffect } from 'react';
import { paymentService } from '../services/api';
import '../styles/Purchases.css';

export const BuyerPurchases = () => {
  const [purchases, setPurchases] = useState([]);
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, delivered, paid

  useEffect(() => {
    loadPurchasesAndWallet();
  }, []);

  const loadPurchasesAndWallet = async () => {
    try {
      setLoading(true);

      // Load wallet
      const walletResponse = await paymentService.getBuyerWallet();
      setWallet(walletResponse.data.wallet);

      // Load purchases
      const purchasesResponse = await paymentService.getBuyerPurchases();
      console.log('📦 [PURCHASES] Loaded purchases:', purchasesResponse.data.purchases);
      setPurchases(purchasesResponse.data.purchases);
    } catch (error) {
      console.error('❌ [PURCHASES] Failed to load purchases:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkReceived = async (purchaseId) => {
    try {
      console.log('📦 [MARK_RECEIVED] Marking purchase as received:', purchaseId);
      
      await paymentService.markPurchaseReceived(purchaseId);
      
      console.log('✅ [MARK_RECEIVED] Purchase marked as received');
      alert('✅ Purchase marked as received!');
      loadPurchasesAndWallet();
    } catch (error) {
      console.error('❌ [MARK_RECEIVED] Failed:', error);
      alert('❌ Error: ' + (error.response?.data?.error || error.message));
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      pending: { text: '⏳ Pending', color: '#ff9800' },
      delivered: { text: '📦 Delivered', color: '#4caf50' },
      paid: { text: '✅ Paid', color: '#2196f3' }
    };
    return statusMap[status] || { text: status, color: '#999' };
  };

  const filteredPurchases = filter === 'all' 
    ? purchases.filter(p => p.status !== 'delivered') 
    : purchases.filter(p => p.status === filter);

  if (loading) return <div className="loading">Loading purchases...</div>;

  return (
    <div className="buyer-purchases">
      <div className="purchases-header">
        <h2>🛍️ My Purchases</h2>
        {wallet && (
          <div className="wallet-info">
            <div className="wallet-balance">
              <span className="label">💳 Wallet Balance:</span>
              <span className="amount">₹{parseFloat(wallet.balance).toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
            </div>
            <div className="wallet-spent">
              <span className="label">Total Spent:</span>
              <span className="amount">₹{parseFloat(wallet.total_spent).toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
            </div>
          </div>
        )}
      </div>

      <div className="purchases-filter">
        <button 
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          Active ({purchases.filter(p => p.status !== 'delivered').length})
        </button>
        <button 
          className={`filter-btn ${filter === 'pending' ? 'active' : ''}`}
          onClick={() => setFilter('pending')}
        >
          ⏳ Pending ({purchases.filter(p => p.status === 'pending').length})
        </button>
        <button 
          className={`filter-btn ${filter === 'delivered' ? 'active' : ''}`}
          onClick={() => setFilter('delivered')}
        >
          📦 Delivered ({purchases.filter(p => p.status === 'delivered').length})
        </button>
        <button 
          className={`filter-btn ${filter === 'paid' ? 'active' : ''}`}
          onClick={() => setFilter('paid')}
        >
          ✅ Paid ({purchases.filter(p => p.status === 'paid').length})
        </button>
      </div>

      {filteredPurchases.length === 0 ? (
        <div className="empty-state">
          <p>📭 No purchases {filter !== 'all' ? `in "${filter}" status` : 'yet'}</p>
        </div>
      ) : (
        <div className="purchases-list">
          {filteredPurchases.map((purchase) => {
            const statusInfo = getStatusBadge(purchase.status);
            return (
              <div key={purchase.id} className="purchase-card">
                <div className="purchase-header">
                  <div className="purchase-info">
                    <h3>🍇 {purchase.crop_type} - Grade {purchase.grade || 'A'}</h3>
                    <p className="farmer-name">👨‍🌾 {purchase.farmer_name}</p>
                    <p className="fpo-name">🏢 {purchase.fpo_name}</p>
                  </div>
                  <div className="purchase-status">
                    <span className="status-badge" style={{ backgroundColor: statusInfo.color }}>
                      {statusInfo.text}
                    </span>
                  </div>
                </div>

                <div className="purchase-details">
                  <div className="detail-row">
                    <span className="label">Quantity:</span>
                    <span className="value">{purchase.quantity} kg</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Price per kg:</span>
                    <span className="value">₹{parseFloat(purchase.price_per_kg).toFixed(2)}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Total Amount:</span>
                    <span className="value amount-due">₹{parseFloat(purchase.total_amount).toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Purchased on:</span>
                    <span className="value">{formatDate(purchase.created_at)}</span>
                  </div>
                  {purchase.received_at && (
                    <div className="detail-row">
                      <span className="label">Received on:</span>
                      <span className="value">{formatDate(purchase.received_at)}</span>
                    </div>
                  )}
                </div>

                <div className="purchase-actions">
                  {purchase.status === 'pending' && (
                    <button 
                      className="btn btn-primary"
                      onClick={() => handleMarkReceived(purchase.id)}
                    >
                      📦 Mark as Received
                    </button>
                  )}
                  {purchase.status === 'delivered' && (
                    <div className="status-info">
                      <p>💰 Payment held in escrow. FPO will confirm delivery.</p>
                    </div>
                  )}
                  {purchase.status === 'paid' && (
                    <div className="status-info">
                      <p>✅ Payment completed and transferred to farmer.</p>
                    </div>
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
