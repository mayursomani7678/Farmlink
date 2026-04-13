#!/bin/bash
set -e

CROP_ID="550e8400-e29b-41d4-a716-446655440001"
EMAIL="omtapdiya75@gmail.com"
PASSWORD="om123@&123"

echo "🔐 Logging in..."
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}" | jq -r '.token')
echo "✅ Token obtained"

echo ""
echo "📱 Registering IoT device..."
DEVICE_RESPONSE=$(curl -s -X POST http://localhost:5000/api/iot/devices \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"cropId\":\"$CROP_ID\",\"deviceName\":\"Sensor1\"}")
DEVICE_ID=$(echo $DEVICE_RESPONSE | jq -r '.device.id')
echo "✅ Device: $DEVICE_ID"

echo ""
echo "📤 Submitting IoT sensor data..."
curl -s -X POST http://localhost:5000/api/iot/readings/$DEVICE_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"temperature":28.5,"humidity":65,"mq2":150}' > /dev/null
echo "✅ Sensor data submitted"

echo ""
echo "📊 Fetching certificates from database..."
IMAGE_CERT_ID=$(psql -d farmlink -U tapdiyaom -t -c "
SELECT id FROM image_quality_certificates 
WHERE crop_id = '$CROP_ID' 
ORDER BY created_at DESC LIMIT 1;" | tr -d ' ')

IOT_CERT_ID=$(psql -d farmlink -U tapdiyaom -t -c "
SELECT id FROM iot_quality_certificates 
WHERE crop_id = '$CROP_ID' 
ORDER BY created_at DESC LIMIT 1;" | tr -d ' ')

echo "Image Cert: $IMAGE_CERT_ID"
echo "IoT Cert: $IOT_CERT_ID"

echo ""
echo "⭐ Generating final grade..."
curl -s -X POST http://localhost:5000/api/fpo/generate-grade \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"cropId\": \"$CROP_ID\",
    \"imageCertificateId\": \"$IMAGE_CERT_ID\",
    \"iotCertificateId\": \"$IOT_CERT_ID\"
  }" | jq .

echo ""
echo "✅ Complete workflow finished!"