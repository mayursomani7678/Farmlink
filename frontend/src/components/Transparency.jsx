import React, { useState, useEffect } from 'react';
import { transparencyService } from '../services/api';
import '../styles/Transparency.css';

export const FarmerTransparency = ({ farmerId }) => {
  const [history, setHistory] = useState([]);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, [farmerId]);

  const loadHistory = async () => {
    try {
      const response = await transparencyService.getFarmerHistory(farmerId);
      setHistory(response.data.transactions);
    } catch (error) {
      console.error('Failed to load history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewFullTrace = async (transactionId) => {
    try {
      const response = await transparencyService.getTransactionTrace(transactionId);
      setSelectedTransaction(response.data.traceability);
    } catch (error) {
      console.error('Failed to load trace:', error);
    }
  };

  if (loading) return <div className="loading">Loading transparency data...</div>;

  return (
    <div className="farmer-transparency">
      <h1>📊 Your Transactions & Pricing</h1>

      {!selectedTransaction ? (
        <div className="transactions-list">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Crop</th>
                <th>Grade</th>
                <th>Quantity</th>
                <th>Price (per unit)</th>
                <th>Total</th>
                <th>Buyer</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {history.map((transaction) => (
                <tr key={transaction.id}>
                  <td>{new Date(transaction.created_at).toLocaleDateString()}</td>
                  <td>{transaction.crop_type}</td>
                  <td className={`grade grade-${transaction.grade}`}>{transaction.grade}</td>
                  <td>{transaction.quantity_sold} kg</td>
                  <td>₹{transaction.price_per_unit}</td>
                  <td>₹{transaction.total_price}</td>
                  <td>{transaction.buyer_name}</td>
                  <td>
                    <button
                      className="btn btn-sm"
                      onClick={() => handleViewFullTrace(transaction.id)}
                    >
                      View Trace
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="transaction-trace">
          <button className="btn btn-secondary" onClick={() => setSelectedTransaction(null)}>
            ← Back to List
          </button>

          <div className="trace-flow">
            <div className="trace-step">
              <h3>🌾 Farmer</h3>
              <p>{selectedTransaction.farmer_name}</p>
              <p className="location">📍 {selectedTransaction.plot_location}</p>
            </div>

            <div className="arrow">→</div>

            <div className="trace-step">
              <h3>🏢 FPO</h3>
              <p>{selectedTransaction.fpo_name}</p>
              <p className="details">Certification Authority</p>
            </div>

            <div className="arrow">→</div>

            <div className="trace-step">
              <h3>🏭 Buyer</h3>
              <p>{selectedTransaction.buyer_name}</p>
              <p className="details">Purchased on {new Date(selectedTransaction.created_at).toLocaleDateString()}</p>
            </div>
          </div>

          <div className="quality-metrics">
            <div className="metric-card">
              <h4>Quality Metrics</h4>
              <p>Image Quality: {(selectedTransaction.image_quality * 100).toFixed(1)}%</p>
              <p>IoT Environment: {(selectedTransaction.iot_quality * 100).toFixed(1)}%</p>
            </div>

            <div className="metric-card">
              <h4>Pricing</h4>
              <p>Your Price: ₹{selectedTransaction.price_per_unit}/kg</p>
              <p>Quantity: {selectedTransaction.quantity_sold} kg</p>
              <p className="total">Total Received: ₹{selectedTransaction.total_price}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const PriceComparison = ({ farmerId }) => {
  const [priceHistory, setPriceHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPriceHistory();
  }, [farmerId]);

  const loadPriceHistory = async () => {
    try {
      const response = await transparencyService.getPriceHistory(farmerId);
      setPriceHistory(response.data.priceHistory);
    } catch (error) {
      console.error('Failed to load price history:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="price-comparison">
      <h2>💰 Price Comparison</h2>

      <div className="comparison-table">
        <table>
          <thead>
            <tr>
              <th>Crop</th>
              <th>Grade</th>
              <th>Your Price</th>
              <th>Market Price</th>
              <th>FPO Margin</th>
              <th>Transparency %</th>
            </tr>
          </thead>
          <tbody>
            {priceHistory.map((record, idx) => (
              <tr key={idx}>
                <td>{record.crop_type}</td>
                <td className={`grade grade-${record.grade}`}>{record.grade}</td>
                <td>₹{record.price_received}</td>
                <td>₹{record.market_price_at_time}</td>
                <td>₹{record.fpo_margin}</td>
                <td>{(record.transparency_score * 100).toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
