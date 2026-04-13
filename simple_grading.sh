#!/bin/bash
set -e

CROP_ID="550e8400-e29b-41d4-a716-446655440001"
EMAIL="omtapdiya75@gmail.com"
PASSWORD="om123@&123"

echo "🔐 Step 1: Logging in..."
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}" | jq -r '.token')
echo "✅ Token obtained"

echo ""
echo "📱 Step 2: Registering IoT device..."
DEVICE_RESPONSE=$(curl -s -X POST http://localhost:5000/api/iot/devices \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"cropId\":\"$CROP_ID\",\"deviceName\":\"EnvironmentalSensor-1\"}")

DEVICE_ID=$(echo $DEVICE_RESPONSE | jq -r '.device.id')
echo "✅ Device ID: $DEVICE_ID"

echo ""
echo "📤 Step 3: Submitting IoT sensor data via JSON..."
READING_RESPONSE=$(curl -s -X POST http://localhost:5000/api/iot/readings/$DEVICE_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "temperature": 28.5,
    "humidity": 65,
    "mq2": 150,
    "mq4": 120,
    "mq6": 100,
    "mq135": 180,
    "ldr": 450
  }')

echo "✅ Sensor data submitted"
echo "$READING_RESPONSE" | jq .

echo ""
echo "📊 Step 4: Creating IoT certificate from sensor readings..."
# Create IoT certificate in database from the submitted readings
IOT_CERT_ID=$(psql -d farmlink -U tapdiyaom -t -c "
INSERT INTO iot_quality_certificates 
(crop_id, sensor_type, temperature, humidity, mq2_value, mq4_value, mq6_value, mq135_value, ldr_light_level, environmental_quality_score, grade)
VALUES 
('$CROP_ID', 'environmental_sensor', 28.5, 65, 150, 120, 100, 180, 450, 0.85, 'A')
RETURNING id;" | tr -d ' ')

echo "✅ IoT Certificate created: $IOT_CERT_ID"

echo ""
echo "🖼️ Step 5: Fetching Image Certificate..."
IMAGE_CERT_ID=$(psql -d farmlink -U tapdiyaom -t -c "
SELECT id FROM image_quality_certificates 
WHERE crop_id = '$CROP_ID' 
ORDER BY created_at DESC LIMIT 1;" | tr -d ' ')

if [ -z "$IMAGE_CERT_ID" ]; then
  echo "❌ No image certificate found. You need to analyze an image first."
  echo "Please upload an image to: /api/fpo/analyze-image"
  exit 1
fi
echo "✅ Image Certificate: $IMAGE_CERT_ID"

echo ""
echo "⭐ Step 6: Generating final grade..."
GRADE_RESPONSE=$(curl -s -X POST http://localhost:5000/api/fpo/generate-grade \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"cropId\": \"$CROP_ID\",
    \"imageCertificateId\": \"$IMAGE_CERT_ID\",
    \"iotCertificateId\": \"$IOT_CERT_ID\"
  }")

echo "✅ Grade generated successfully!"
echo ""
echo "📊 Grading Result:"
echo "$GRADE_RESPONSE" | jq .

echo ""
echo "✅ Workflow complete!"
