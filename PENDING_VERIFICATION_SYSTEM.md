# 🌾 Pending Verification & Advance Payment System - Complete Implementation

## 📋 System Overview

This system enables a three-stage crop marketplace workflow:

### Stage 1: **Pending Verification** ⏳
- Farmer lists crop with initial grading
- Marked as `verification_status = 'pending'`
- **Visible in marketplace** to buyers
- Buyers can **pay advance** (minimum 10% of price)
- Advance payment creates partial purchase in DB

### Stage 2: **Verified** ✅
- FPO completes quality verification
- Status changes to `verification_status = 'verified'`
- Listing remains visible in marketplace
- Buyers with advance payments see it as "Pending Payment"
- Buyers can now **pay remaining balance**

### Stage 3: **Confirmed** ✅✅
- Buyer completes remaining payment
- Purchase marked as `payment_stage = 'full_paid'`
- Ready for delivery

---

## 🗄️ Database Schema Changes

### New Columns on `product_listings`
```sql
verification_status VARCHAR/ENUM - pending, verified, rejected, available
verification_notes TEXT - reason if rejected
verified_at TIMESTAMP - when verification completed
```

### New Columns on `purchases`
```sql
advance_paid DECIMAL - amount paid as advance
remaining_to_pay DECIMAL - balance due
payment_stage VARCHAR - advance_paid, full_paid
verified_at TIMESTAMP - when buyer completed full payment
```

---

## 🔧 Backend Implementation

### 1. New Controllers Created

#### `AdvancePaymentController.js`
**Methods:**
- `payAdvance()` - Accept advance payment for pending listing
  - Min 10% of price
  - Check wallet balance
  - Create purchase with `payment_stage = 'advance_paid'`
  - Deduct from wallet

- `getPendingPayments()` - Show buyer's pending payments
  - List all purchases with `payment_stage = 'advance_paid'`
  - Include remaining balance

- `completePendingPayment()` - Complete remaining balance
  - Check wallet balance
  - Update purchase to `payment_stage = 'full_paid'`
  - Deduct remaining amount from wallet

#### `FPOVerificationController.js`
**Methods:**
- `verifyCrop()` - FPO marks crop as verified
  - Change `verification_status = 'pending'` → `'verified'`
  - Notify buyers with advance payments

- `getPendingVerification()` - Show FPO pending items
  - List crops pending verification
  - Show count of advance buyers

- `rejectListing()` - Reject crop with reason
  - Mark as `verification_status = 'rejected'`
  - Store rejection reason

### 2. Updated Controllers

#### `BuyerController.js` - `getMarketplace()`
**Changes:**
- Include BOTH verified AND pending listings
- Group results by: crop_type, grade, verification_status
- Return structure:
  ```json
  {
    "listings": {
      "verified": [...],
      "pending": [...]
    },
    "summary": {
      "total_verified": N,
      "total_pending": N
    }
  }
  ```

### 3. New Routes Added

**Payment Routes** (`/api/payment/`)
```
POST   /advance-payment              (buyer) - Pay advance
GET    /pending-payments             (buyer) - View pending
POST   /complete-payment/:purchaseId (buyer) - Complete payment
GET    /verification/pending         (fpo)   - View pending verification
PATCH  /verification/:id/verify      (fpo)   - Mark as verified
PATCH  /verification/:id/reject      (fpo)   - Reject listing
```

---

## 💻 Frontend Implementation Points

### 1. Marketplace Tab System
```
┌─────────────────────────────┐
│ ✅ Verified | ⏳ Pending     │
└─────────────────────────────┘
     |                |
   [Verified         [Pending
    Listings]        Listings]
     |                |
   Buy Now    Pay Advance
```

### 2. Listing Card Changes

**Verified Listing:**
- Show "Buy Now" button
- Normal purchase flow

**Pending Listing:**
- Show ⏳ "Pending Verification" badge
- Show "Pay Advance" button
- Info: "Minimum 10% advance, credited after verification"

### 3. Advance Payment Modal
- Input field for advance amount
- Show minimum (10%)
- Show remaining to pay after verification
- "Confirm Payment" button

### 4. New "Pending Payments" Tab
Shows all purchases with `payment_stage = 'advance_paid'`:
- Crop type & grade
- Farmer name
- Amount already paid (advance)
- **Remaining to pay** (highlighted)
- If `verification_status = 'verified'`: Show "Complete Payment" button
- If `verification_status = 'pending'`: Show "Waiting for verification..."

---

## 🧪 Testing Workflow

### Test Case 1: Pay Advance for Pending Crop

```bash
# Step 1: List pending crop
curl "http://localhost:3000/api/buyer/marketplace?include_pending=true"

# Step 2: Choose pending listing (e.g., Grapes Grade A)
# Find in response.listings.pending

# Step 3: Pay advance (minimum 10% of ₹55 = ₹5.50)
curl -X POST http://localhost:5000/api/payment/advance-payment \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "listingId": "listing-uuid",
    "advanceAmount": 10
  }'

# Step 4: Check pending payments
curl http://localhost:5000/api/payment/pending-payments \
  -H "Authorization: Bearer $TOKEN"

# Expect: Purchase with advance_paid=10, remaining_to_pay=45, payment_stage="advance_paid"
```

### Test Case 2: FPO Verifies Crop

```bash
# Step 1: FPO views pending verification
curl http://localhost:5000/api/payment/verification/pending \
  -H "Authorization: Bearer $FPO_TOKEN"

# Step 2: FPO completes quality check and marks verified
curl -X PATCH http://localhost:5000/api/payment/verification/listing-uuid/verify \
  -H "Authorization: Bearer $FPO_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"notes": "Quality check passed"}'

# In DB: product_listings.verification_status = 'verified'
```

### Test Case 3: Buyer Completes Payment

```bash
# Step 1: Get pending payments (after verification)
curl http://localhost:5000/api/payment/pending-payments \
  -H "Authorization: Bearer $BUYER_TOKEN"

# Expect: Same purchase but now verification_status = 'verified'

# Step 2: Complete remaining payment
curl -X POST http://localhost:5000/api/payment/complete-payment/purchase-uuid \
  -H "Authorization: Bearer $BUYER_TOKEN"

# In DB: purchases.payment_stage = 'full_paid', remaining_to_pay = 0
```

---

## 📊 Database Query Examples

```sql
-- See all pending verification crops
SELECT id, crop_type, grade, price_per_kg, verification_status 
FROM product_listings 
WHERE verification_status = 'pending';

-- See all purchases with advance paid
SELECT p.id, p.advance_paid, p.remaining_to_pay, p.payment_stage
FROM purchases p
WHERE p.payment_stage = 'advance_paid';

-- See total pending payments by buyer
SELECT buyer_id, SUM(remaining_to_pay) as total_pending
FROM purchases 
WHERE payment_stage = 'advance_paid'
GROUP BY buyer_id;
```

---

## 🚀 Deployment Checklist

- [x] Database migration applied
- [x] `AdvancePaymentController.js` created
- [x] `FPOVerificationController.js` created
- [x] Routes added to `paymentRoutes.js`
- [x] `BuyerController.getMarketplace()` updated
- [ ] Frontend: Marketplace tab system implemented
- [ ] Frontend: Pending listings card UI added
- [ ] Frontend: Advance payment modal created
- [ ] Frontend: Pending payments tab implemented
- [ ] Frontend: Payment completion logic added
- [ ] Testing: All workflows tested end-to-end
- [ ] Production: Deploy to staging environment

---

## 💡 Key Points

### For Buyers
✅ Can browse pending verification crops  
✅ Can lock in price with small advance  
✅ Only pay full amount after verification  
✅ See all pending payments clearly  

### For FPOs
✅ Know exactly which crops have buyer interest (advance paid)  
✅ Can batch verify and notify buyers  
✅ Rejection reasons stored for records  

### For Farmers
✅ Faster verification with buyer motivation (advance paid)  
✅ Reduced risk if buyer cancels after verification  

---

## 📞 API Response Examples

### Advance Payment Success
```json
{
  "success": true,
  "message": "Advance payment of ₹10 registered. Remaining: ₹45.00",
  "purchase": {
    "id": "purchase-uuid",
    "advance_paid": 10,
    "remaining_to_pay": 45,
    "price_per_kg": 55
  },
  "listing": {
    "crop_type": "Grapes",
    "grade": "A",
    "farmer": "Rajesh Kumar"
  }
}
```

### Pending Payments List
```json
{
  "success": true,
  "pending_payments": [
    {
      "id": "purchase-uuid",
      "crop_type": "Grapes",
      "grade": "A",
      "advance_paid": 10,
      "remaining_to_pay": 45,
      "verification_status": "pending"
    }
  ],
  "total_pending_amount": 45
}
```

### Complete Payment Success
```json
{
  "success": true,
  "message": "Payment completed successfully",
  "purchase": {
    "id": "purchase-uuid",
    "status": "confirmed",
    "total_paid": 55
  }
}
```

---

## 🐛 Error Handling

All endpoints return appropriate error messages:

```json
{
  "error": "Advance must be at least ₹5.50 (10% of ₹55)",
  "min_advance": 5.50
}
```

Frontend should display these to buyers with copy-paste friendly formats.
