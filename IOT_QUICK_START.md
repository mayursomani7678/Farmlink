# 🌐 IoT Real-Time Data Integration - Quick Start

## 🚀 System is Ready for IoT Data!

Your Farmlink backend now has a complete **real-time IoT sensor data ingestion system** on port **5000**.

---

## 📋 Quick Summary

### What's New?
✅ **Real-time IoT endpoint** for continuous sensor data  
✅ **JSON format** for easy integration (no more CSV uploads needed)  
✅ **Multiple submission modes**: Single, Batch, Stream  
✅ **Automatic quality scoring** based on sensor readings  
✅ **Historical data tracking** with timestamps  
✅ **Database tables** for device management and sensor readings  

### Supported Sensors
- **Gas Sensors:** MQ2, MQ4, MQ6, MQ135
- **Environmental:** DHT11 (Temperature + Humidity), LDR (Light)

---

## 🎯 Quickest Way to Send Data

### Option 1: Using cURL (Simplest)

```bash
# 1. Register a device first
curl -X POST http://localhost:5000/api/iot/devices \
  -H "Content-Type: application/json" \
  -d '{
    "cropId": "your-crop-uuid",
    "deviceName": "MyFarmSensor",
    "location": "Field 1"
  }'

# Copy the device ID from response

# 2. Send sensor data
curl -X POST http://localhost:5000/api/iot/readings/DEVICE_ID_HERE \
  -H "Content-Type: application/json" \
  -d '{
    "mq2": 350,
    "mq4": 850,
    "mq6": 8500,
    "mq135": 120,
    "temperature": 8.5,
    "humidity": 90.2,
    "ldr": 450
  }'
```

### Option 2: Using Python (For IoT Devices)

```python
import requests
import json

# Device setup
SERVER = "http://localhost:5000"
CROP_ID = "your-crop-uuid"
DEVICE_ID = "your-device-id"

# Register device
device_payload = {
    "cropId": CROP_ID,
    "deviceName": "Raspberry-Pi-01",
    "location": "Farm Plot 2"
}

device_response = requests.post(
    f"{SERVER}/api/iot/devices",
    json=device_payload
)
DEVICE_ID = device_response.json()['device']['id']
print(f"Device registered: {DEVICE_ID}")

# Send sensor readings
sensor_data = {
    "mq2": 350,
    "mq4": 850,
    "mq6": 8500,
    "mq135": 120,
    "temperature": 8.5,
    "humidity": 90.2,
    "ldr": 450
}

response = requests.post(
    f"{SERVER}/api/iot/readings/{DEVICE_ID}",
    json=sensor_data
)

result = response.json()
print(f"✓ Grade: {result['quality']['grade']}")
print(f"✓ Score: {result['quality']['score']:.2%}")
```

### Option 3: Using Node.js

```javascript
const axios = require('axios');

const SERVER = 'http://localhost:5000';
const CROP_ID = 'your-crop-uuid';

async function sendSensorData() {
  // Register device
  const deviceRes = await axios.post(`${SERVER}/api/iot/devices`, {
    cropId: CROP_ID,
    deviceName: 'NodeJS-Sensor-01',
    location: 'Field 1'
  });
  
  const deviceId = deviceRes.data.device.id;
  console.log('Device registered:', deviceId);
  
  // Send sensor reading
  const reading = {
    mq2: 350,
    mq4: 850,
    mq6: 8500,
    mq135: 120,
    temperature: 8.5,
    humidity: 90.2,
    ldr: 450
  };
  
  const readingRes = await axios.post(
    `${SERVER}/api/iot/readings/${deviceId}`,
    reading
  );
  
  console.log(`✓ Grade: ${readingRes.data.quality.grade}`);
  console.log(`✓ Score: ${readingRes.data.quality.score.toFixed(2)}`);
}

sendSensorData();
```

---

## 📡 All Available Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `POST` | `/api/iot/devices` | Register IoT device |
| `GET` | `/api/iot/devices/:deviceId` | Get device info |
| `DELETE` | `/api/iot/devices/:deviceId` | Remove device |
| `POST` | `/api/iot/readings/:deviceId` | Submit 1 reading |
| `POST` | `/api/iot/readings/:deviceId/batch` | Submit multiple readings |
| `GET` | `/api/iot/readings/:deviceId/latest` | Get latest readings |
| `GET` | `/api/iot/readings/:deviceId/history` | Get historical data |
| `GET` | `/api/iot/readings/:deviceId/average` | Get average readings |
| `GET` | `/api/iot/readings/:deviceId/stream` | Poll new readings |
| `GET` | `/api/iot/crop/:cropId/devices` | List all devices for crop |

---

## 🧪 Test the Endpoints

### Run the Full Test Suite:

```bash
cd /Users/tapdiyaom/Desktop/FARMLINK_PROJECT

# Make test script executable
chmod +x test_iot_api.py

# Run all tests (requires Python 3 + requests)
python3 test_iot_api.py
```

This will:
1. ✓ Register a test device
2. ✓ Get device info
3. ✓ Submit single reading
4. ✓ Batch submit readings
5. ✓ Get latest readings
6. ✓ Get historical data
7. ✓ Get averages
8. ✓ Stream new data
9. ✓ List crop devices
10. ✓ Run 30-second continuous simulation

---

## 📊 What Happens When You Send Data

### 1. **Data Received**
```json
POST /api/iot/readings/:deviceId
{
  "mq2": 350,
  "temperature": 8.5,
  "humidity": 90.2,
  ...
}
```

### 2. **Quality Validation**
System checks against optimal ranges:
- Temperature: 0-10°C ✓
- Humidity: 85-95% ✓
- LDR Light: <500 Lux ✓
- Gas levels: Within limits ✓

### 3. **Quality Score Calculated**
```
Score = 100%
  - 15% if temp not optimal
  - 15% if humidity not optimal
  - 10% if light not optimal
  - 25% if gas levels high
= Final Score (0-100%)
```

### 4. **Grade Assigned**
- **Grade A:** 85%+ (Optimal storage conditions)
- **Grade B:** 65-84% (Good conditions)
- **Grade C:** <65% (Acceptable but not ideal)

### 5. **Response Returned**
```json
{
  "success": true,
  "reading": { /* stored data */ },
  "quality": {
    "score": 0.92,
    "grade": "A",
    "validation": { /* details */ }
  }
}
```

---

## 💡 Common Use Cases

### Use Case 1: Continuous Monitoring
Send readings every **30-60 seconds** from your IoT device:

```python
import time
import requests

device_id = "your-device-id"

while True:
    sensor_data = {
        "mq2": read_mq2_sensor(),
        "temperature": read_temperature(),
        "humidity": read_humidity(),
        "ldr": read_light_level()
        # ... all other sensors
    }
    
    requests.post(
        f"http://localhost:5000/api/iot/readings/{device_id}",
        json=sensor_data
    )
    
    time.sleep(30)  # Wait 30 seconds before next reading
```

### Use Case 2: Batch Upload from Logger Device
If your device has internal storage, upload multiple readings at once:

```python
readings = []

# Collect data for an hour
for i in range(60):
    readings.append({
        "mq2": ...,
        "temperature": ...,
        # ... sensor data
    })

# Upload all at once
requests.post(
    f"http://localhost:5000/api/iot/readings/{device_id}/batch",
    json={"readings": readings}
)
```

### Use Case 3: Real-Time Dashboard
Poll for new data to display on a dashboard:

```javascript
let lastTimestamp = null;

setInterval(async () => {
  const url = lastTimestamp
    ? `/api/iot/readings/${deviceId}/stream?sinceTimestamp=${lastTimestamp}`
    : `/api/iot/readings/${deviceId}/stream`;
  
  const res = await fetch(url);
  const data = await res.json();
  
  // Update dashboard with new readings
  updateDashboard(data.readings);
  
  if (data.latest_timestamp) {
    lastTimestamp = new Date(data.latest_timestamp).getTime() / 1000;
  }
}, 10000); // Check every 10 seconds
```

---

## 🔌 Hardware Integration Examples

### Arduino/ESP32 with WiFi

```cpp
#include <WiFi.h>
#include <HTTPClient.h>
#include "DHT.h"
#include <ArduinoJson.h>

// WiFi
const char* ssid = "YOUR_WiFi";
const char* password = "YOUR_PASSWORD";

// Server
const char* serverName = "http://192.168.1.X:5000/api/iot/readings/YOUR_DEVICE_ID";

// Sensors
#define MQ2_PIN A0
#define DHTPIN 2
#define DHTTYPE DHT11
#define LDRPIN A1

DHT dht(DHTPIN, DHTTYPE);

void setup() {
  Serial.begin(115200);
  WiFi.begin(ssid, password);
  
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi connected!");
  dht.begin();
}

void loop() {
  // Read sensors
  int mq2 = analogRead(MQ2_PIN);
  float temperature = dht.readTemperature();
  float humidity = dht.readHumidity();
  int ldr = analogRead(LDRPIN);
  
  // Create JSON
  StaticJsonDocument<200> doc;
  doc["mq2"] = mq2;
  doc["temperature"] = temperature;
  doc["humidity"] = humidity;
  doc["ldr"] = ldr;
  
  String payload;
  serializeJson(doc, payload);
  
  // Send to server
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(serverName);
    http.addHeader("Content-Type", "application/json");
    
    int httpCode = http.POST(payload);
    Serial.println("Response: " + String(httpCode));
    
    http.end();
  }
  
  delay(30000); // Wait 30 seconds
}
```

### Raspberry Pi with Python

```python
#!/usr/bin/env python3
import board
import adafruit_dht
import analogio
import requests
import time

# Setup DHT11
dht_device = adafruit_dht.DHT11(board.D4)

# Setup ADC for analog sensors
mq2 = analogio.AnalogIn(board.A0)
ldr = analogio.AnalogIn(board.A1)

DEVICE_ID = "your-device-id"
SERVER_URL = "http://localhost:5000/api/iot"

while True:
    try:
        # Read sensors
        temp = dht_device.temperature
        humid = dht_device.humidity
        mq2_value = mq2.value
        ldr_value = ldr.value
        
        # Send to server
        data = {
            "temperature": temp,
            "humidity": humid,
            "mq2": mq2_value / 4096 * 1023,  # Convert to 0-1023 range
            "ldr": ldr_value / 4096 * 1023
        }
        
        response = requests.post(
            f"{SERVER_URL}/readings/{DEVICE_ID}",
            json=data
        )
        
        print(f"✓ Data sent. Grade: {response.json()['quality']['grade']}")
    
    except Exception as e:
        print(f"Error: {e}")
    
    time.sleep(30)
```

---

## 📱 Real-World Workflow

```
1. IoT Device (Raspberry Pi)
   ↓ Reads sensors every 30s
   ↓ Sends JSON to /api/iot/readings/:deviceId
   ↓

2. Backend Server (Node.js)
   ↓ Validates readings
   ↓ Calculates quality score
   ↓ Stores in PostgreSQL
   ↓

3. Database Storage
   ✓ Continuous historical data
   ✓ Multiple devices per crop
   ✓ Time-series analysis ready

4. FPO Dashboard
   ↓ Streams latest data
   ↓ Shows quality trends
   ↓ Alerts on conditions
```

---

## 🎯 Next Steps

1. **Test with cURL** - Verify endpoints work
2. **Write IoT firmware** - Integrate with your hardware
3. **Set up continuous submission** - Send data every 30-60 seconds
4. **Monitor quality scores** - Watch grades in real-time
5. **Use for automated grading** - Integrate with FPO dashboard

---

## 📚 Full Documentation

For detailed API reference, code examples, and troubleshooting:

👉 **See [IOT_API_GUIDE.md](IOT_API_GUIDE.md)**

---

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| "Device not found" | Verify device ID is correct |
| Connection refused | Ensure backend is running: `npm run dev` |
| Invalid sensor data | All values must be numbers (not strings) |
| No grade returned | Check if readings are valid JSON |
| Slow response | Too many historical queries - use batch submission |

---

## 💬 API Response Format

All responses follow this format:

**Success:**
```json
{
  "success": true,
  "reading": { /* sensor data */ },
  "quality": {
    "score": 0.92,
    "grade": "A",
    "validation": { /* details */ }
  },
  "message": "Description"
}
```

**Error:**
```json
{
  "error": "Description of error",
  "status": 400
}
```

---

## 🌱 You're Ready!

Your Farmlink IoT system is live and ready to receive real-time sensor data!

📡 **Start sending data to:** `http://localhost:5000/api/iot`

Made with ❤️ by the Farmlink Team
