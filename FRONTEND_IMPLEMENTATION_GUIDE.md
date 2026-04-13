/**
 * FRONTEND IMPLEMENTATION GUIDE FOR PENDING VERIFICATION SYSTEM
 * 
 * This document outlines the frontend changes needed to support:
 * 1. Pending Verification Listings in Marketplace
 * 2. Advance Payment Flow
 * 3. Pending Payments Section
 * 4. Payment Completion Flow
 */

// ============================================
// 1. UPDATE BuyerMarketplaceService.js
// ============================================

// Add method to marketplace service:
async payAdvanceForPendingListing(listingId, advanceAmount) {
  return this.api.post('/payment/advance-payment', {
    listingId,
    advanceAmount
  });
}

async getPendingPayments() {
  return this.api.get('/payment/pending-payments');
}

async completePendingPayment(purchaseId) {
  return this.api.post(`/payment/complete-payment/${purchaseId}`);
}

// ============================================
// 2. UPDATE BuyerPages.jsx MARKETPLACE SECTION
// ============================================

// STEP 1: Modify loadListings() to handle verified and pending separately
const loadListings = async () => {
  setLoading(true);
  try {
    const response = await buyerService.getMarketplace(filters);
    console.log('📦 [MARKETPLACE] Loaded listings:', response.data);
    
    // Separate verified and pending
    const verified = response.data.listings.verified || [];
    const pending = response.data.listings.pending || [];
    
    setListings({
      verified,
      pending
    });
    setEmptyVerified(verified.length === 0);
  } catch (error) {
    console.error('Failed to load listings:', error);
  } finally {
    setLoading(false);
  }
};

// STEP 2: Add state for active tab
const [activeListingTab, setActiveListingTab] = useState('verified'); // 'verified' or 'pending'

// STEP 3: Update JSX to render BOTH verified and pending tabs
// In marketplace rendering:

<div className="marketplace-tabs">
  <button 
    className={activeListingTab === 'verified' ? 'active' : ''}
    onClick={() => setActiveListingTab('verified')}
  >
    ✅ Verified Listings ({listings.verified?.length || 0})
  </button>
  <button 
    className={activeListingTab === 'pending' ? 'active' : ''}
    onClick={() => setActiveListingTab('pending')}
  >
    ⏳ Pending Verification ({listings.pending?.length || 0})
  </button>
</div>

// STEP 4: Render appropriate listing cards based on tab
const currentListings = activeListingTab === 'verified' ? 
  listings.verified : listings.pending;

// STEP 5: For PENDING listings, show different UI:
{pendingListing && (
  <div className="listing-card pending-badge">
    <span className="badge">⏳ Pending Verification</span>
    {/* Show listing details */}
    <p>Crop: {pendingListing.crop_type} {pendingListing.grade}</p>
    <p>Price: ₹{pendingListing.min_price}/kg to ₹{pendingListing.max_price}/kg</p>
    <p>Farmers: {pendingListing.farmer_names}</p>
    
    {/* IMPORTANT: Show advance payment info */}
    <div className="advance-info">
      <p>💡 You can pay an advance (minimum 10%) and lock this listing</p>
      <p>Advance will be credited when verification completes</p>
    </div>
    
    {/* Show Pay Advance button instead of Buy Now */}
    <button onClick={() => openAdvancePaymentModal(pendingListing)}>
      💰 Pay Advance
    </button>
  </div>
)}

// ============================================
// 3. CREATE ADVANCE PAYMENT MODAL
// ============================================

// Add new state
const [showAdvanceModal, setShowAdvanceModal] = useState(false);
const [advanceListingSelected, setAdvanceListingSelected] = useState(null);
const [advanceAmount, setAdvanceAmount] = useState('');
const [processingAdvance, setProcessingAdvance] = useState(false);

// Modal component
function AdvancePaymentModal() {
  if (!showAdvanceModal || !advanceListingSelected) return null;
  
  const listing = advanceListingSelected;
  const totalPrice = listing.avg_price || listing.min_price;
  const minAdvance = totalPrice * 0.1; // 10% minimum
  const remaining = totalPrice - parseFloat(advanceAmount || 0);
  
  const handlePayAdvance = async () => {
    if (!advanceAmount || parseFloat(advanceAmount) < minAdvance) {
      alert(`Advance must be at least ₹${minAdvance.toFixed(2)}`);
      return;
    }
    
    setProcessingAdvance(true);
    try {
      const response = await buyerService.payAdvanceForPendingListing(
        listing.id,
        parseFloat(advanceAmount)
      );
      
      alert('✅ Advance payment successful!');
      console.log('Payment response:', response);
      
      // Refresh listings and close modal
      loadListings();
      setShowAdvanceModal(false);
      setAdvanceAmount('');
      
    } catch (error) {
      alert(`❌ Payment failed: ${error.response?.data?.error || error.message}`);
    } finally {
      setProcessingAdvance(false);
    }
  };
  
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>💰 Pay Advance for {listing.crop_type} {listing.grade}</h3>
        
        <div className="modal-info">
          <p>From: {listing.farmer_names}</p>
          <p>Price per kg: ₹{totalPrice.toFixed(2)}</p>
          <p>Minimum Advance (10%): ₹{minAdvance.toFixed(2)}</p>
        </div>
        
        <div className="modal-input">
          <label>Advance Amount (₹)</label>
          <input 
            type="number" 
            value={advanceAmount}
            onChange={(e) => setAdvanceAmount(e.target.value)}
            min={minAdvance}
            placeholder={`Min ₹${minAdvance.toFixed(2)}`}
          />
          <p className="remaining-info">
            Remaining to pay after verification: ₹{Math.max(0, remaining).toFixed(2)}
          </p>
        </div>
        
        <div className="modal-buttons">
          <button 
            onClick={handlePayAdvance} 
            disabled={processingAdvance}
            className="btn-primary"
          >
            {processingAdvance ? 'Processing...' : 'Confirm Payment'}
          </button>
          <button 
            onClick={() => setShowAdvanceModal(false)}
            className="btn-secondary"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// 4. ADD PENDING PAYMENTS TAB
// ============================================

// Add state for pending payments
const [pendingPayments, setPendingPayments] = useState([]);
const [loadingPendingPayments, setLoadingPendingPayments] = useState(false);

// Load pending payments when tab is opened
const loadPendingPayments = async () => {
  setLoadingPendingPayments(true);
  try {
    const response = await buyerService.getPendingPayments();
    setPendingPayments(response.data.pending_payments || []);
  } catch (error) {
    console.error('Failed to load pending payments:', error);
  } finally {
    setLoadingPendingPayments(false);
  }
};

// In your purchases section, add new tab:
<div className="purchase-tabs">
  <button 
    className={activePurchaseTab === 'all' ? 'active' : ''}
    onClick={() => setActivePurchaseTab('all')}
  >
    📦 My Purchases
  </button>
  <button 
    className={activePurchaseTab === 'pending' ? 'active' : ''}
    onClick={() => {
      setActivePurchaseTab('pending');
      loadPendingPayments();
    }}
  >
    ⏳ Pending Payments ({pendingPayments.length})
  </button>
</div>

// Render Pending Payments section
{activePurchaseTab === 'pending' && (
  <div className="pending-payments-section">
    {loadingPendingPayments && <p>Loading...</p>}
    {pendingPayments.length === 0 && <p>No pending payments</p>}
    
    {pendingPayments.map(payment => (
      <div key={payment.id} className="pending-payment-card">
        <div className="payment-header">
          <h4>{payment.crop_type} {payment.grade}</h4>
          <span className={`status ${payment.verification_status}`}>
            {payment.verification_status === 'verified' ? '✅ Verified' : '⏳ Pending Verification'}
          </span>
        </div>
        
        <div className="payment-details">
          <p>From: {payment.farmer_name}</p>
          <p>FPO: {payment.fpo || 'Direct'}</p>
          <p>Advance Paid: ₹{parseFloat(payment.advance_paid).toFixed(2)}</p>
          <p className="remaining">
            Remaining to Pay: ₹{parseFloat(payment.remaining_to_pay).toFixed(2)}
          </p>
        </div>
        
        {payment.remaining_to_pay > 0 && payment.verification_status === 'verified' && (
          <button 
            onClick={() => handleCompletePayment(payment.id)}
            className="btn-complete-payment"
          >
            💳 Complete Payment
          </button>
        )}
        
        {payment.verification_status === 'pending' && (
          <p className="info-text">⏳ Waiting for verification to complete...</p>
        )}
      </div>
    ))}
  </div>
)}

// ============================================
// 5. HANDLE PAYMENT COMPLETION
// ============================================

const handleCompletePayment = async (purchaseId) => {
  if(!window.confirm('Complete pending payment?')) return;
  
  try {
    const response = await buyerService.completePendingPayment(purchaseId);
    alert('✅ Payment completed!');
    loadPendingPayments(); // Refresh list
    loadPurchases(); // Refresh main purchases
  } catch (error) {
    alert(`❌ Error: ${error.response?.data?.error || error.message}`);
  }
};

// ============================================
// 6. STYLING SUGGESTIONS
// ============================================

/**

.listing-card.pending-badge {
  border: 2px solid #FFA500;
  background: linear-gradient(135deg, #FFF8DC 0%, #FFE4B5 100%);
}

.pending-badge .badge {
  display: inline-block;
  background: #FFA500;
  color: white;
  padding: 6px 12px;
  border-radius: 12px;
  font-size: 12px;
  margin-bottom: 10px;
}

.advance-info {
  background: #FFFACD;
  padding: 10px;
  border-radius: 8px;
  margin: 10px 0;
  font-size: 14px;
}

.pending-payment-card {
  border: 1px solid #DDD;
  padding: 15px;
  margin: 10px 0;
  border-radius: 8px;
  background: #F9F9F9;
}

.pending-payment-card.verified {
  background: #E8F5E9;
  border-color: #4CAF50;
}

.pending-payment-card .remaining {
  color: #D32F2F;
  font-weight: bold;
  font-size: 16px;
}

.btn-complete-payment {
  background: #4CAF50;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  margin-top: 10px;
}

.btn-complete-payment:hover {
  background: #45a049;
}

*/

export {
  AdvancePaymentModal,
  loadListings,
  loadPendingPayments,
  handleCompletePayment
};
