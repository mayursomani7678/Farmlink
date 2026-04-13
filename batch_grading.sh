#!/bin/bash
set -e

CROP_ID="550e8400-e29b-41d4-a716-446655440001"
EMAIL="omtapdiya75@gmail.com"
PASSWORD="om123@&123"

echo "🔐 Logging in..."
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}" | jq -r '.token')
echo "✅ Token"

echo ""
echo "📱 Registering device..."
DEVICE_ID=$(curl -s -X POST http://localhost:5000/api/iot/devices \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"cropId\":\"$CROP_ID\",\"deviceName\":\"Sensor1\"}" | jq -r '.device.id')
echo "✅ Device: $DEVICE_ID"

echo ""
echo "📤 Submitting batch IoT readings via JSON..."
curl -s -X POST http://localhost:5000/api/iot/readings/$DEVICE_ID/batch \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "readings": [
      {"temperature": 28.5, "humidity": 65, "mq2": 150, "mq4": 120, "mq6": 100, "mq135": 180, "ldr": 450},
      {"temperature": 29.2, "humidity": 62, "mq2": 155, "mq4": 125, "mq6": 105, "mq135": 185, "ldr": 460},
      {"temperature": 28.8, "humidity": 64, "mq2": 152, "mq4": 122, "mq6": 102, "mq135": 182, "ldr": 455}
    ]
  }' | jq .

echo "✅ Batch submitted"

echo ""
echo "📊 Creating IoT certificate from readings..."
IOT_CERT_ID=$(psql -d farmlink -U tapdiyaom -t -c "
INSERT INTO iot_quality_certificates 
(crop_id, sensor_type, temperature, humidity, mq2_value, mq4_value, mq6_value, mq135_value, ldr_light_level, environmental_quality_score, grade)
VALUES 
('$CROP_ID', 'environmental_sensor', 28.8, 63.67, 152.33, 122.33, 102.33, 182.33, 455, 0.88, 'A')
RETURNING id;" | tr -d ' ')

echo "✅ IoT Certificate: $IOT_CERT_ID"

echo ""
echo "🖼️ Getting Image Certificate..."
IMAGE_CERT_ID=$(psql -d farmlink -U tapdiyaom -t -c "
SELECT id FROM image_quality_certificates 
WHERE crop_id = '$CROP_ID' 
ORDER BY created_at DESC LIMIT 1;" | tr -d ' ')
echo "✅ Image Certificate: $IMAGE_CERT_ID"

echo ""
echo "⭐ Generating grade..."
curl -s -X POST http://localhost:5000/api/fpo/generate-grade \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"cropId\": \"$CROP_ID\",
    \"imageCertificateId\": \"$IMAGE_CERT_ID\",
    \"iotCertificateId\": \"$IOT_CERT_ID\"
  }" | jq .

echo ""
echo "✅ Complete!"
