# 🌐 Farmlink IoT Real-Time Data Integration - Complete Setup

## ✅ What's Been Implemented

Your Farmlink system now has a **complete real-time IoT data ingestion pipeline** ready to receive continuous sensor readings in JSON format.

---

## 📦 What Was Created

### 1. **Database Tables**
```sql
✓ iot_devices
  - Device registration and management
  - Track active sensors per crop
  
✓ iot_sensor_readings
  - Store all sensor readings with timestamps
  - Indexed for fast queries
  - Support for time-series analysis
```

### 2. **Backend Services**
| File | Purpose |
|------|---------|
| `IoTDeviceService.js` | Device & reading management |
| `IoTController.js` | API endpoint handlers |
| `iotRoutes.js` | Route definitions |

### 3. **API Endpoints (10 Total)**
```
POST   /api/iot/devices                      → Register device
GET    /api/iot/devices/:deviceId            → Get device info
DELETE /api/iot/devices/:deviceId            → Remove device
GET    /api/iot/crop/:cropId/devices         → List crop devices

POST   /api/iot/readings/:deviceId           → Submit single reading
POST   /api/iot/readings/:deviceId/batch     → Submit multiple readings
GET    /api/iot/readings/:deviceId/latest    → Get latest readings
GET    /api/iot/readings/:deviceId/history   → Get historical data
GET    /api/iot/readings/:deviceId/average   → Get average readings
GET    /api/iot/readings/:deviceId/stream    → Poll for new readings
```

### 4. **Documentation**
| File | Content |
|------|---------|
| `IOT_QUICK_START.md` | Quick start guide (read first!) |
| `IOT_API_GUIDE.md` | Full API reference & integration guide |
| `test_iot_api.py` | Python test suite |
| `backend/test_iot_simple.js` | Node.js quick test |

---

## 🎯 How It Works

### Data Flow
```
1. IoT Device (Arduino/RPi/ESP32)
   ↓ Collects sensor data
   ↓ Sends JSON to port 5000
   
2. Backend API
   ↓ Validates data format
   ↓ Calculates quality score
   ↓ Stores in PostgreSQL
   
3. Database
   ✓ iot_devices - tracks devices
   ✓ iot_sensor_readings - stores readings
   
4. Quality Assessment
   ✓ Compares to optimal ranges
   ✓ Assigns Grade (A/B/C)
   ✓ Returns to device
   
5. FPO Dashboard (Future)
   ✓ Displays real-time data
   ✓ Shows quality trends
   ✓ Alerts on issues
```

---

## 🚀 Quick Start (3 Steps)

### Step 1: Test the System
```bash
# Option A: Node.js test (fastest)
cd /Users/tapdiyaom/Desktop/FARMLINK_PROJECT/backend
node test_iot_simple.js

# Option B: Python test (detailed)
cd /Users/tapdiyaom/Desktop/FARMLINK_PROJECT
python3 test_iot_api.py
```

### Step 2: Register Your IoT Device
```bash
curl -X POST http://localhost:5000/api/iot/devices \
  -H "Content-Type: application/json" \
  -d '{
    "cropId": "your-crop-uuid-here",
    "deviceName": "My-Farm-Sensor",
    "location": "Field 1"
  }'
```

**Response:**
```json
{
  "success": true,
  "device": {
    "id": "device-uuid-xxx",
    "device_name": "My-Farm-Sensor",
    "status": "active"
  }
}
```

### Step 3: Send Sensor Data
```bash
curl -X POST http://localhost:5000/api/iot/readings/DEVICE_UUID \
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

**Response:**
```json
{
  "success": true,
  "quality": {
    "score": 0.92,
    "grade": "A",
    "validation": {
      "temperature_optimal": true,
      "humidity_optimal": true,
      "ldr_optimal": true,
      "gas_levels_acceptable": true
    }
  }
}
```

---

## 📊 Sensors Supported

### Gas Sensors
| Sensor | Range | Good Levels |
|--------|-------|------------|
| MQ-2 | 0-1000 ppm | < 400 ppm |
| MQ-4 | 200-10000 ppm | < 1000 ppm |
| MQ-6 | 4000-10000+ ppm | < 10000 ppm |
| MQ-135 | 0-1000 ppm | < 150 ppm |

### Environmental Sensors
| Sensor | Optimal | Grade |
|--------|---------|-------|
| Temperature | 0-10°C | ±3°C acceptable |
| Humidity | 85-95% | ±5% acceptable |
| Light (LDR) | < 500 Lux | <600 Lux acceptable |

---

## 💻 Code Examples

### Python (IoT Device)
```python
import requests
import time

device_id = "your-device-uuid"
server = "http://localhost:5000/api/iot"

# Send reading every 30 seconds
while True:
    sensor_data = {
        "temperature": read_temp(),
        "humidity": read_humidity(),
        "mq2": read_mq2(),
        "mq4": read_mq4(),
        "mq6": read_mq6(),
        "mq135": read_mq135(),
        "ldr": read_ldr()
    }
    
    response = requests.post(
        f"{server}/readings/{device_id}",
        json=sensor_data
    )
    
    result = response.json()
    print(f"Grade: {result['quality']['grade']}")
    
    time.sleep(30)
```

### JavaScript/Node.js
```javascript
const axios = require('axios');

const deviceId = "your-device-uuid";
const server = "http://localhost:5000/api/iot";

setInterval(async () => {
  const sensorData = {
    temperature: 8.5,
    humidity: 90.2,
    mq2: 350,
    mq4: 850,
    mq6: 8500,
    mq135: 120,
    ldr: 450
  };
  
  const response = await axios.post(
    `${server}/readings/${deviceId}`,
    sensorData
  );
  
  console.log(`Grade: ${response.data.quality.grade}`);
}, 30000);
```

### Arduino/ESP32
```cpp
HTTPClient http;
String payload = "{\"temperature\": 8.5, \"humidity\": 90.2, \"mq2\": 350}";

http.begin("http://192.168.1.100:5000/api/iot/readings/DEVICE_ID");
http.addHeader("Content-Type", "application/json");
http.POST(payload);
http.end();

delay(30000); // Wait 30 seconds
```

---

## 🧪 Testing Commands

### Quick Test All Endpoints
```bash
# Navigate to backend
cd backend

# Run Node.js test suite  
node test_iot_simple.js

# Or run Python test suite
cd ..
python3 test_iot_api.py
```

### Manual Testing

**Register Device:**
```bash
curl -X POST http://localhost:5000/api/iot/devices \
  -H "Content-Type: application/json" \
  -d '{"cropId":"crop-1","deviceName":"Sensor-1","location":"Field A"}'
```

**Submit Reading:**
```bash
# Replace DEVICE_ID with actual ID from registration
curl -X POST http://localhost:5000/api/iot/readings/DEVICE_ID \
  -H "Content-Type: application/json" \
  -d '{"temperature":8.5,"humidity":90.2,"mq2":350,"mq4":850,"mq6":8500,"mq135":120,"ldr":450}'
```

**Get Latest:**
```bash
curl http://localhost:5000/api/iot/readings/DEVICE_ID/latest?limit=5
```

**Get Average:**
```bash
curl http://localhost:5000/api/iot/readings/DEVICE_ID/average?minutesBack=60
```

---

## 📈 Continuous Submission Pattern

For production IoT devices, use this pattern:

```python
import time
import requests
import json

class IoTClient:
    def __init__(self, device_id, server_url="http://localhost:5000"):
        self.device_id = device_id
        self.server = f"{server_url}/api/iot"
    
    def read_sensors(self):
        """Read all sensors and return data"""
        return {
            "temperature": 8.5,      # From DHT11
            "humidity": 90.2,        # From DHT11
            "mq2": 350,              # From MQ-2
            "mq4": 850,              # From MQ-4
            "mq6": 8500,             # From MQ-6
            "mq135": 120,            # From MQ-135
            "ldr": 450               # From LDR
        }
    
    def send_reading(self):
        """Send one reading to server"""
        try:
            data = self.read_sensors()
            response = requests.post(
                f"{self.server}/readings/{self.device_id}",
                json=data,
                timeout=5
            )
            
            if response.status_code == 201:
                result = response.json()
                grade = result['quality']['grade']
                score = result['quality']['score']
                print(f"✓ Submitted - Grade: {grade} | Score: {score:.1%}")
                return True
            else:
                print(f"✗ Error {response.status_code}")
                return False
        except Exception as e:
            print(f"✗ Failed: {e}")
            return False
    
    def run(self, interval_seconds=30):
        """Run continuous submission"""
        print(f"Starting continuous submission ({interval_seconds}s interval)")
        
        while True:
            self.send_reading()
            time.sleep(interval_seconds)

# Usage
if __name__ == "__main__":
    client = IoTClient("your-device-id")
    client.run(interval_seconds=30)  # Send every 30 seconds
```

---

## 🔄 Batch Submission (For Data Loggers)

If your device stores data internally:

```bash
curl -X POST http://localhost:5000/api/iot/readings/DEVICE_ID/batch \
  -H "Content-Type: application/json" \
  -d '{
    "readings": [
      {"temperature": 8.1, "humidity": 89.8, "mq2": 340, ...},
      {"temperature": 8.3, "humidity": 90.0, "mq2": 345, ...},
      {"temperature": 8.5, "humidity": 90.2, "mq2": 350, ...}
    ]
  }'
```

---

## 🎓 Quality Score Calculation

The system automatically calculates a quality grade:

```
Maximum Score: 100%

Deductions:
- Temperature not in 0-10°C: -15%
- Humidity not in 85-95%: -15%
- Light > 500 Lux: -10%
- Gas levels high: -25%

Grade Assignment:
- Score ≥ 85%: Grade A (Optimal storage)
- Score 65-84%: Grade B (Good storage)
- Score < 65%: Grade C (Acceptable but at risk)
```

---

## 📄 File Locations

```
/Users/tapdiyaom/Desktop/FARMLINK_PROJECT/
├── IOT_QUICK_START.md              ← Start here!
├── IOT_API_GUIDE.md                ← Full reference
├── test_iot_api.py                 ← Python tests
├── backend/
│   ├── test_iot_simple.js          ← Node.js tests
│   ├── src/
│   │   ├── services/IoTDeviceService.js
│   │   ├── controllers/IoTController.js
│   │   ├── routes/iotRoutes.js
│   │   ├── database/schema.sql     (updated)
│   │   └── server.js               (updated)
│   └── .env
└── README.md
```

---

## ✅ Verification Checklist

- [x] Database tables created (iot_devices, iot_sensor_readings)
- [x] Backend service layer (IoTDeviceService.js)
- [x] Controller layer (IoTController.js)
- [x] API routes (iotRoutes.js)
- [x] Server integration (server.js updated)
- [x] Documentation (IOT_QUICK_START.md, IOT_API_GUIDE.md)
- [x] Test suites (test_iot_api.py, test_iot_simple.js)
- [x] Backend running on port 5000
- [x] All endpoints tested and working
- [x] Quality scoring implemented
- [x] Database indexes created for performance

---

## 🚀 Next: Integration Steps

### 1. **Prepare IoT Hardware**
   - Set up Arduino/Raspberry Pi/ESP32
   - Connect sensors (MQ-2, 4, 6, 135, DHT11, LDR)
   - Configure WiFi

### 2. **Get Crop ID**
   - Register crop via FPO Dashboard
   - Copy crop UUID

### 3. **Register Device**
   - POST `/api/iot/devices` with crop ID
   - Save returned device ID

### 4. **Write Firmware**
   - Integrate IoT client code
   - Read sensors every 30-60 seconds
   - POST to `/api/iot/readings/{deviceId}`

### 5. **Monitor Quality**
   - Watch grades in real-time
   - Adjust storage conditions if needed
   - Use data for final certification

---

## 🐛 Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| "Cannot connect" | Backend not running | `cd backend && npm run dev` |
| "Device not found" | Wrong device ID | Check UUID format |
| "Invalid sensor data" | Non-numeric values | Ensure all values are numbers |
| "No readings stored" | Data format wrong | Check JSON structure |
| Slow response | Too many queries | Use batch submission |

---

## 💡 Production Recommendations

1. **Submission Frequency:** Every 30-60 seconds (not too frequent)
2. **Error Handling:** Retry on failure with exponential backoff
3. **Data Validation:** Check sensor ranges before sending
4. **Device ID:** Store securely (environment variable or config file)
5. **Batch Upload:** Use for historical data or unreliable networks
6. **Monitoring:** Track last_reading_at to detect device failures

---

## 📚 Documentation Files

**Quick Reference:**
- 👉 **IOT_QUICK_START.md** - Read this first!

**Complete Reference:**
- 📖 **IOT_API_GUIDE.md** - Full API documentation, all endpoints, code examples

**Testing:**
- 🧪 **test_iot_api.py** - Python comprehensive test suite
- ✅ **backend/test_iot_simple.js** - Node.js quick test

---

## 🌟 Example Workflow

```
1. Register Crop (via FPO Dashboard)
   ↓ Get: crop-uuid

2. Register IoT Device
   POST /api/iot/devices
   ↓ Get: device-uuid

3. Start Arduino/RPi Code
   Every 30 seconds:
   POST /api/iot/readings/device-uuid
   ↓ Get: grade and quality score

4. FPO Can See (Future Dashboard)
   ✓ Real-time sensor data
   ✓ Quality trends
   ✓ Alerts if conditions bad

5. Final Grading
   Use average readings over whole storage period
   Generate final Grade A/B/C certificate
```

---

## 🎉 You're Ready!

Your IoT integration system is **fully operational** and ready to:
- ✅ Receive real-time sensor data
- ✅ Calculate quality scores
- ✅ Store historical data
- ✅ Track environmental conditions
- ✅ Generate quality certificates

**Start sending data to:**
```
http://localhost:5000/api/iot/
```

---

## 📞 Support

**For API details:** See IOT_API_GUIDE.md  
**For quick start:** See IOT_QUICK_START.md  
**For testing:** Run `node backend/test_iot_simple.js`

---

Made with ❤️ by the Farmlink Team

🌱 **Connecting FPOs with Buyers through Fair Trade & Transparency** 🌱
