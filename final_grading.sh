#!/bin/bash
set -e

CROP_ID="550e8400-e29b-41d4-a716-446655440001"
EMAIL="omtapdiya75@gmail.com"
PASSWORD="om123@&123"

echo "================================"
echo "🍇 Complete Grading Workflow 🍇"
echo "================================"

echo ""
echo "🔐 Step 1: Logging in..."
LOGIN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")

TOKEN=$(echo $LOGIN | jq -r '.token')
if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
  echo "❌ Login failed"
  echo "$LOGIN" | jq .
  exit 1
fi
echo "✅ Token: ${TOKEN:0:20}..."

echo ""
echo "📱 Step 2: Registering IoT Device..."
DEVICE=$(curl -s -X POST http://localhost:5000/api/iot/devices \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"cropId\":\"$CROP_ID\",\"deviceName\":\"GrapeSensor-1\"}")

DEVICE_ID=$(echo $DEVICE | jq -r '.device.id // empty')
if [ -z "$DEVICE_ID" ]; then
  echo "❌ Device registration failed"
  echo "$DEVICE" | jq .
  exit 1
fi
echo "✅ Device Register: $DEVICE_ID"

echo ""
echo "📤 Step 3: Sending Batch IoT Data (JSON)..."
BATCH=$(curl -s -X POST http://localhost:5000/api/iot/readings/$DEVICE_ID/batch \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "readings": [
      {"temperature": 28.5, "humidity": 65, "mq2": 150, "mq4": 120},
      {"temperature": 29.2, "humidity": 62, "mq2": 155, "mq4": 125},
      {"temperature": 28.8, "humidity": 64, "mq2": 152, "mq4": 122}
    ]
  }')

echo "✅ Readings submitted:"
echo $BATCH | jq '.success'

echo ""
echo "📊 Step 4: Creating IoT Certificate..."
# Generate a UUID for the certificate
IOT_CERT_ID=$(python3 -c "import uuid; print(str(uuid.uuid4()))")
# Insert with the key columns including all sensor readings
psql -d farmlink -U tapdiyaom -c "
INSERT INTO iot_quality_certificates 
(id, crop_id, sensor_type, temperature, humidity, mq2_value, mq4_value, mq6_value, mq135_value, ldr_light_level, environmental_quality_score, grade)
VALUES 
('$IOT_CERT_ID', '$CROP_ID', 'environmental_sensor', 28.83, 63.67, 152.33, 122.33, 110.5, 95.2, 450.0, 0.87, 'A');" > /dev/null 2>&1
echo "✅ IoT Certificate: $IOT_CERT_ID"

echo ""
echo "🖼️ Step 5: Getting Image Certificate..."
IMAGE_CERT_ID=$(psql -d farmlink -U tapdiyaom -t -c "
SELECT id FROM image_quality_certificates 
WHERE crop_id = '$CROP_ID' 
ORDER BY created_at DESC LIMIT 1;" 2>/dev/null | tr -d ' ')
if [ -z "$IMAGE_CERT_ID" ]; then
  echo "❌ No image certificate found - you must analyze an image first!"
  exit 1
fi
echo "✅ Image Certificate: $IMAGE_CERT_ID"

echo ""
echo "⭐ Step 6: Generating Final Grade..."
GRADE=$(curl -s -X POST http://localhost:5000/api/fpo/generate-grade \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"cropId\": \"$CROP_ID\",
    \"imageCertificateId\": \"$IMAGE_CERT_ID\",
    \"iotCertificateId\": \"$IOT_CERT_ID\"
  }")

FINAL_GRADE=$(echo $GRADE | jq -r '.gradingResult.finalGrade // .error')
if [ "$FINAL_GRADE" = "null" ] || [ -z "$FINAL_GRADE" ]; then
  echo "❌ Grade generation failed"
  echo "$GRADE" | jq .
  exit 1
fi

echo "✅ Final Grade: $FINAL_GRADE"

echo ""
echo "📋 COMPLETE RESULTS:"
echo "===================="
echo "$GRADE" | jq '{
  success: .success,
  finalGrade: .gradingResult.finalGrade,
  imageGrade: .gradingResult.imageGrade,
  iotGrade: .gradingResult.iotGrade,
  finalScore: .gradingResult.finalScore
}'

echo ""
echo "✅ Workflow Complete!"
