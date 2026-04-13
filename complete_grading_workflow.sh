#!/bin/bash
set -e

CROP_ID="550e8400-e29b-41d4-a716-446655440001"
EMAIL="omtapdiya75@gmail.com"
PASSWORD="om123@&123"

echo "🔐 Step 1: Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.token')
if [ "$TOKEN" == "null" ] || [ -z "$TOKEN" ]; then
  echo "❌ Login failed"
  exit 1
fi
echo "✅ Token obtained"

echo ""
echo "📱 Step 2: Registering IoT device..."
DEVICE_RESPONSE=$(curl -s -X POST http://localhost:5000/api/iot/devices \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"cropId\":\"$CROP_ID\",\"deviceName\":\"EnvironmentalSensor-1\"}")

DEVICE_ID=$(echo $DEVICE_RESPONSE | jq -r '.device.id')
if [ "$DEVICE_ID" == "null" ] || [ -z "$DEVICE_ID" ]; then
  echo "❌ Device registration failed"
  echo "$DEVICE_RESPONSE" | jq .
  exit 1
fi
echo "✅ Device ID: $DEVICE_ID"

echo ""
echo "📤 Step 3: Submitting IoT sensor readings..."
curl -s -X POST http://localhost:5000/api/iot/readings/$DEVICE_ID \
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
  }' > /dev/null
echo "✅ Sensor data submitted"

echo ""
echo "📋 Step 4: Creating IoT CSV certificate..."
# Create temp CSV file with IoT data
CSV_FILE="/tmp/iot_data_$CROP_ID.csv"
cat > $CSV_FILE << 'CSVEOF'
timestamp,temperature,humidity,mq2,mq4,mq6,mq135,ldr
2026-04-11T10:00:00Z,28.5,65,150,120,100,180,450
2026-04-11T10:30:00Z,29.2,62,155,125,105,185,460
2026-04-11T11:00:00Z,28.8,64,152,122,102,182,455
CSVEOF

IoT_CERT_RESPONSE=$(curl -s -X POST http://localhost:5000/api/fpo/upload-iot-certificate \
  -H "Authorization: Bearer $TOKEN" \
  -F "crop=$CROP_ID" \
  -F "file=@$CSV_FILE")

IOT_CERT_ID=$(echo $IoT_CERT_RESPONSE | jq -r '.certificate.id')
if [ "$IOT_CERT_ID" == "null" ] || [ -z "$IOT_CERT_ID" ]; then
  echo "❌ IoT certificate creation failed"
  echo "$IoT_CERT_RESPONSE" | jq .
  rm -f $CSV_FILE
  exit 1
fi
echo "✅ IoT Certificate ID: $IOT_CERT_ID"
rm -f $CSV_FILE

echo ""
echo "📊 Step 5: Fetching Image Certificate from database..."
IMAGE_CERT_ID=$(psql -d farmlink -U tapdiyaom -t -c "
SELECT id FROM image_quality_certificates 
WHERE crop_id = '$CROP_ID' 
ORDER BY created_at DESC LIMIT 1;" | tr -d ' ')

if [ -z "$IMAGE_CERT_ID" ]; then
  echo "❌ No image certificate found"
  exit 1
fi
echo "✅ Image Certificate ID: $IMAGE_CERT_ID"

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

FINAL_GRADE=$(echo $GRADE_RESPONSE | jq -r '.gradingResult.finalGrade // .error')
if [ "$FINAL_GRADE" == "Internal server error" ] || echo "$FINAL_GRADE" | grep -q "error"; then
  echo "❌ Grade generation failed"
  echo "$GRADE_RESPONSE" | jq .
  exit 1
fi

echo "✅ Final Grade: $FINAL_GRADE"
echo ""
echo "📊 Complete Grading Result:"
echo "$GRADE_RESPONSE" | jq .

echo ""
echo "✅ Complete workflow finished successfully!"
