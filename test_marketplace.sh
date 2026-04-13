#!/bin/bash
set -e

# Test Marketplace and Mark as Delivered

BUYER_EMAIL="buyer@test.com"
BUYER_PASSWORD="Buyer@123"

echo "🔐 Logging in as buyer..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$BUYER_EMAIL\",\"password\":\"$BUYER_PASSWORD\"}")

echo "Response: $LOGIN_RESPONSE"

TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token // empty')

if [ -z "$TOKEN" ]; then
  echo "❌ Login failed. Response: $LOGIN_RESPONSE"
  exit 1
fi

echo "✅ Got Token: ${TOKEN:0:20}..."

echo ""
echo "📊 Testing Marketplace..."
curl -s "http://localhost:5000/api/buyer/marketplace" | jq '.listings'

echo ""
echo "💳 Creating a purchase..."
PURCHASE_RESPONSE=$(curl -s -X POST http://localhost:5000/api/payment/purchases \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"cropType":"Grapes","grade":"A","quantity":100}')

echo "Response: $PURCHASE_RESPONSE"

PURCHASE_ID=$(echo "$PURCHASE_RESPONSE" | jq -r '.purchase.id // empty')

if [ -z "$PURCHASE_ID" ]; then
  echo "❌ Purchase creation failed"
  exit 1
fi

echo "✅ Purchase Created: $PURCHASE_ID"

echo ""
echo "📦 Getting purchases..."
curl -s "http://localhost:5000/api/payment/purchases" \
  -H "Authorization: Bearer $TOKEN" | jq '.purchases'

echo ""
echo "✅ Marking purchase as delivered..."
DELIVERY_RESPONSE=$(curl -s -X PATCH "http://localhost:5000/api/payment/purchases/$PURCHASE_ID/received" \
  -H "Authorization: Bearer $TOKEN")

echo "Response: $DELIVERY_RESPONSE"

echo ""
echo "✅ Test Complete!"
