#!/bin/bash

echo "🔐 Step 1: Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "omtapdiya75@gmail.com",
    "password": "om123@&123"
  }')

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.token')
echo "✅ Token: $TOKEN"
echo ""

echo "📱 Step 2: Registering IoT device..."
DEVICE_RESPONSE=$(curl -s -X POST http://localhost:5000/api/iot/devices \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "cropId": "550e8400-e29b-41d4-a716-446655440001",
    "deviceName": "EnvironmentalSensor-1",
    "deviceType": "environmental_sensor",
    "location": "North-Field"
  }')

DEVICE_ID=$(echo $DEVICE_RESPONSE | jq -r '.device.id')
echo "✅ Device ID: $DEVICE_ID"
echo ""

echo "📤 Step 3: Submitting sensor data..."
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
  }' | jq .

echo ""
echo "✅ All done!"
