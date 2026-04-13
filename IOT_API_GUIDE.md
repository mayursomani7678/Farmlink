# 🌐 Farmlink IoT Real-Time Sensor Integration Guide

## Overview

The Farmlink IoT system allows continuous real-time sensor data ingestion from environmental monitoring devices. Sensor data is received in JSON format and can be submitted:
- **Single Reading:** One reading at a time
- **Batch Submissions:** Multiple readings in one request
- **Stream Polling:** Continuous polling for latest data

---

## Sensor Modules Supported

### Gas Sensors
- **MQ-2:** LPG, Alcohol, Smoke detection
- **MQ-4:** Methane, CNG detection  
- **MQ-6:** LPG, Butane detection
- **MQ-135:** Air quality (NH3, NOx, Alcohol, Benzene, Smoke, CO2)

### Environmental Sensors
- **DHT11:** Temperature & Humidity
- **LDR:** Light intensity level

---

## API Endpoints

### 1. Register IoT Device

**Endpoint:** `POST /api/iot/devices`

Register a new sensor device for a crop.

**Request:**
```json
{
  "cropId": "crop-uuid-here",
  "deviceName": "Farm-A-Sensor-01",
  "deviceType": "environmental_sensor",
  "location": "Plot 2, Nashik"
}
```

**Response:**
```json
{
  "success": true,
  "device": {
    "id": "device-uuid",
    "crop_id": "crop-uuid",
    "device_name": "Farm-A-Sensor-01",
    "device_type": "environmental_sensor",
    "status": "active",
    "location": "Plot 2, Nashik",
    "created_at": "2026-04-11T10:30:00Z"
  },
  "message": "Device registered successfully. Device ID: device-uuid"
}
```

**Example cURL:**
```bash
curl -X POST http://localhost:5000/api/iot/devices \
  -H "Content-Type: application/json" \
  -d '{
    "cropId": "crop-123",
    "deviceName": "Sensor-01",
    "deviceType": "environmental_sensor",
    "location": "Field 1"
  }'
```

---

### 2. Submit Single Sensor Reading

**Endpoint:** `POST /api/iot/readings/:deviceId`

Submit a single real-time sensor reading.

**Path Parameters:**
- `deviceId`: UUID of registered device

**Request Body (JSON):**
```json
{
  "mq2": 350,
  "mq4": 850,
  "mq6": 8500,
  "mq135": 120,
  "temperature": 8.5,
  "humidity": 90.2,
  "ldr": 450,
  "timestamp": "2026-04-11T10:45:30Z"
}
```

**Response:**
```json
{
  "success": true,
  "reading": {
    "id": "reading-uuid",
    "device_id": "device-uuid",
    "crop_id": "crop-uuid",
    "mq2_value": 350,
    "mq4_value": 850,
    "mq6_value": 8500,
    "mq135_value": 120,
    "temperature": 8.5,
    "humidity": 90.2,
    "ldr_light_level": 450,
    "received_at": "2026-04-11T10:45:30Z"
  },
  "quality": {
    "score": 0.92,
    "grade": "A",
    "validation": {
      "temperature_optimal": true,
      "humidity_optimal": true,
      "ldr_optimal": true,
      "gas_levels_acceptable": true,
      "overall_optimal": true
    }
  },
  "message": "Sensor reading recorded successfully"
}
```

**Example cURL:**
```bash
curl -X POST http://localhost:5000/api/iot/readings/device-uuid \
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

**Example Python:**
```python
import requests
import json

device_id = "device-uuid"
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
    f"http://localhost:5000/api/iot/readings/{device_id}",
    json=sensor_data
)
print(response.json())
```

---

### 3. Batch Submit Readings

**Endpoint:** `POST /api/iot/readings/:deviceId/batch`

Submit multiple readings in a single request.

**Request:**
```json
{
  "readings": [
    {
      "mq2": 350,
      "mq4": 850,
      "mq6": 8500,
      "mq135": 120,
      "temperature": 8.5,
      "humidity": 90.2,
      "ldr": 450
    },
    {
      "mq2": 345,
      "mq4": 845,
      "mq6": 8400,
      "mq135": 118,
      "temperature": 8.4,
      "humidity": 90.1,
      "ldr": 455
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "count": 2,
  "readings": [
    { /* reading 1 */ },
    { /* reading 2 */ }
  ],
  "message": "2 sensor readings recorded successfully"
}
```

---

### 4. Get Latest Readings

**Endpoint:** `GET /api/iot/readings/:deviceId/latest?limit=10`

Retrieve the latest sensor readings for a device.

**Query Parameters:**
- `limit`: Number of readings (default: 10, max: 100)

**Response:**
```json
{
  "success": true,
  "readings": [
    { /* latest reading */ },
    { /* previous reading */ }
  ],
  "count": 2
}
```

**Example cURL:**
```bash
curl "http://localhost:5000/api/iot/readings/device-uuid/latest?limit=5"
```

---

### 5. Get Historical Readings

**Endpoint:** `GET /api/iot/readings/:deviceId/history?hoursBack=24&limit=100`

Retrieve historical readings over a time period.

**Query Parameters:**
- `hoursBack`: Hours of history to retrieve (default: 24)
- `limit`: Maximum readings to return (default: 100, max: 1000)

**Response:**
```json
{
  "success": true,
  "readings": [
    { /* readings in chronological order */ }
  ],
  "count": 50,
  "period_hours": 24
}
```

**Example cURL:**
```bash
curl "http://localhost:5000/api/iot/readings/device-uuid/history?hoursBack=48&limit=200"
```

---

### 6. Stream Readings (Polling)

**Endpoint:** `GET /api/iot/readings/:deviceId/stream?sinceTimestamp=1234567890`

Poll for new readings since last check (for real-time monitoring).

**Query Parameters:**
- `sinceTimestamp`: Unix timestamp of last check (optional)

**Response:**
```json
{
  "success": true,
  "readings": [
    { /* new readings since timestamp */ }
  ],
  "count": 3,
  "latest_timestamp": "2026-04-11T10:50:00Z"
}
```

**Example (JavaScript):**
```javascript
let lastTimestamp = null;

async function pollSensorData() {
  const deviceId = "device-uuid";
  const url = lastTimestamp 
    ? `http://localhost:5000/api/iot/readings/${deviceId}/stream?sinceTimestamp=${lastTimestamp}`
    : `http://localhost:5000/api/iot/readings/${deviceId}/stream`;
  
  const response = await fetch(url);
  const data = await response.json();
  
  if (data.latest_timestamp) {
    lastTimestamp = new Date(data.latest_timestamp).getTime() / 1000;
  }
  
  console.log("New readings:", data.readings);
}

// Poll every 10 seconds
setInterval(pollSensorData, 10000);
```

---

### 7. Get Average Readings

**Endpoint:** `GET /api/iot/readings/:deviceId/average?minutesBack=60`

Get average sensor values over a time period (for quality assessment).

**Query Parameters:**
- `minutesBack`: Minutes of history to average (default: 60)

**Response:**
```json
{
  "success": true,
  "averages": {
    "avg_mq2": 348.5,
    "avg_mq4": 847.3,
    "avg_mq6": 8450.2,
    "avg_mq135": 119.2,
    "avg_temperature": 8.45,
    "avg_humidity": 90.15,
    "avg_ldr": 452.3,
    "period_start": "2026-04-11T09:45:00Z",
    "period_end": "2026-04-11T10:45:00Z",
    "reading_count": 60
  },
  "quality": {
    "score": 0.90,
    "grade": "A",
    "validation": { /* validation results */ }
  },
  "period_minutes": 60
}
```

---

### 8. Get All Devices for Crop

**Endpoint:** `GET /api/iot/crop/:cropId/devices`

List all IoT devices registered for a crop.

**Response:**
```json
{
  "success": true,
  "devices": [
    {
      "id": "device-uuid-1",
      "crop_id": "crop-uuid",
      "device_name": "Sensor-01",
      "device_type": "environmental_sensor",
      "status": "active",
      "location": "Field 1",
      "last_reading_at": "2026-04-11T10:50:00Z",
      "created_at": "2026-04-11T08:00:00Z"
    },
    {
      "id": "device-uuid-2",
      "crop_id": "crop-uuid",
      "device_name": "Sensor-02",
      "device_type": "environmental_sensor",
      "status": "active",
      "location": "Field 2",
      "last_reading_at": "2026-04-11T10:48:00Z",
      "created_at": "2026-04-11T08:05:00Z"
    }
  ],
  "count": 2
}
```

---

### 9. Get Device Info

**Endpoint:** `GET /api/iot/devices/:deviceId`

Get detailed information about a specific device.

**Response:**
```json
{
  "success": true,
  "device": {
    "id": "device-uuid",
    "crop_id": "crop-uuid",
    "device_name": "Sensor-01",
    "device_type": "environmental_sensor",
    "status": "active",
    "location": "Plot 2, Nashik",
    "last_reading_at": "2026-04-11T10:50:00Z",
    "created_at": "2026-04-11T08:00:00Z",
    "updated_at": "2026-04-11T10:50:00Z"
  }
}
```

---

### 10. Delete Device

**Endpoint:** `DELETE /api/iot/devices/:deviceId`

Remove a registered IoT device.

**Response:**
```json
{
  "success": true,
  "message": "Device deleted successfully",
  "device": { /* deleted device */ }
}
```

---

## Optimal Sensor Ranges for Quality Assessment

| Sensor | Optimal Range | Grade Impact |
|--------|---------------|--------------|
| Temperature | 0°C - 10°C | ±15% |
| Humidity | 85% - 95% | ±15% |
| LDR Light | < 500 Lux | ±10% |
| MQ2 Gas | < 400 ppm | ±25% |
| MQ4 Gas | < 1000 ppm | ±25% |
| MQ6 Gas | < 10000 ppm | ±25% |

**Quality Score Calculation:**
- Start with 100%
- Subtract 15% if temperature not optimal
- Subtract 15% if humidity not optimal
- Subtract 10% if light level not optimal
- Subtract 25% if gas levels exceed limits

**Grade Assignment:**
- **Grade A:** Score ≥ 0.85 (85%)
- **Grade B:** Score 0.65-0.84 (65-84%)
- **Grade C:** Score < 0.65 (65%)

---

## Arduino/Microcontroller Integration Example

```cpp
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include "DHT.h"

// WiFi credentials
const char* ssid = "YOUR_SSID";
const char* password = "YOUR_PASSWORD";

// Server config
const char* server = "http://localhost:5000";
const char* deviceId = "your-device-uuid";

// Pin definitions
#define MQ2_PIN 34
#define MQ4_PIN 35
#define MQ6_PIN 32
#define MQ135_PIN 33
#define DHTPIN 4
#define DHTTYPE DHT11
#define LDRPIN 36

DHT dht(DHTPIN, DHTTYPE);

void setup() {
  Serial.begin(115200);
  
  // Connect to WiFi
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
  int mq4 = analogRead(MQ4_PIN);
  int mq6 = analogRead(MQ6_PIN);
  int mq135 = analogRead(MQ135_PIN);
  
  float temperature = dht.readTemperature();
  float humidity = dht.readHumidity();
  
  int ldr = analogRead(LDRPIN);
  
  // Create JSON
  StaticJsonDocument<200> doc;
  doc["mq2"] = mq2;
  doc["mq4"] = mq4;
  doc["mq6"] = mq6;
  doc["mq135"] = mq135;
  doc["temperature"] = temperature;
  doc["humidity"] = humidity;
  doc["ldr"] = ldr;
  
  String payload;
  serializeJson(doc, payload);
  
  // Send to server
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    String url = String(server) + "/api/iot/readings/" + deviceId;
    
    http.begin(url);
    http.addHeader("Content-Type", "application/json");
    
    int httpCode = http.POST(payload);
    
    if (httpCode == 201) {
      Serial.println("Sensor data sent successfully!");
      String response = http.getString();
      Serial.println(response);
    } else {
      Serial.print("Error: ");
      Serial.println(httpCode);
    }
    
    http.end();
  }
  
  // Send every 30 seconds
  delay(30000);
}
```

---

## Node.js IoT Client Example

```javascript
const axios = require('axios');

class FarmlinkIoTClient {
  constructor(serverUrl, deviceId) {
    this.serverUrl = serverUrl;
    this.deviceId = deviceId;
    this.client = axios.create({
      baseURL: serverUrl,
      timeout: 5000
    });
  }

  async submitReading(sensorData) {
    try {
      const response = await this.client.post(
        `/api/iot/readings/${this.deviceId}`,
        sensorData
      );
      return response.data;
    } catch (error) {
      console.error('Failed to submit reading:', error.message);
      throw error;
    }
  }

  async getLatestReadings(limit = 10) {
    try {
      const response = await this.client.get(
        `/api/iot/readings/${this.deviceId}/latest`,
        { params: { limit } }
      );
      return response.data;
    } catch (error) {
      console.error('Failed to get readings:', error.message);
      throw error;
    }
  }

  async getAverageReadings(minutesBack = 60) {
    try {
      const response = await this.client.get(
        `/api/iot/readings/${this.deviceId}/average`,
        { params: { minutesBack } }
      );
      return response.data;
    } catch (error) {
      console.error('Failed to get average:', error.message);
      throw error;
    }
  }

  // Simulate sensor data and send every 30 seconds
  async startSimulation() {
    console.log(`Starting simulation for device ${this.deviceId}`);
    
    setInterval(async () => {
      const sensorData = {
        mq2: Math.random() * 400,
        mq4: Math.random() * 1000,
        mq6: Math.random() * 10000,
        mq135: Math.random() * 200,
        temperature: 6 + Math.random() * 4,
        humidity: 85 + Math.random() * 10,
        ldr: Math.random() * 500
      };

      try {
        const result = await this.submitReading(sensorData);
        console.log('Submission successful:', result.quality.grade);
      } catch (error) {
        console.error('Submission failed');
      }
    }, 30000);
  }
}

// Usage
const client = new FarmlinkIoTClient(
  'http://localhost:5000',
  'your-device-uuid'
);

// Start sending data every 30 seconds
client.startSimulation();
```

---

## Python IoT Client Example

```python
import requests
import time
import json
from random import uniform

class FarmlinkIoTClient:
    def __init__(self, server_url, device_id):
        self.server_url = server_url
        self.device_id = device_id
        self.base_url = f"{server_url}/api/iot"
    
    def register_device(self, crop_id, device_name, location=None):
        """Register a new IoT device"""
        payload = {
            "cropId": crop_id,
            "deviceName": device_name,
            "deviceType": "environmental_sensor",
            "location": location or "Field 1"
        }
        
        response = requests.post(
            f"{self.base_url}/devices",
            json=payload
        )
        return response.json()
    
    def submit_reading(self, sensor_data):
        """Submit a single sensor reading"""
        response = requests.post(
            f"{self.base_url}/readings/{self.device_id}",
            json=sensor_data
        )
        return response.json()
    
    def submit_batch(self, readings_list):
        """Submit multiple readings at once"""
        payload = {"readings": readings_list}
        response = requests.post(
            f"{self.base_url}/readings/{self.device_id}/batch",
            json=payload
        )
        return response.json()
    
    def get_latest(self, limit=10):
        """Get latest readings"""
        response = requests.get(
            f"{self.base_url}/readings/{self.device_id}/latest",
            params={"limit": limit}
        )
        return response.json()
    
    def get_average(self, minutes_back=60):
        """Get average readings over time period"""
        response = requests.get(
            f"{self.base_url}/readings/{self.device_id}/average",
            params={"minutesBack": minutes_back}
        )
        return response.json()
    
    def stream_readings(self, since_timestamp=None):
        """Get new readings since last check"""
        params = {}
        if since_timestamp:
            params["sinceTimestamp"] = since_timestamp
        
        response = requests.get(
            f"{self.base_url}/readings/{self.device_id}/stream",
            params=params
        )
        return response.json()
    
    def simulate_and_send(self, interval_seconds=30):
        """Simulate sensor readings and send continuously"""
        print(f"Starting simulation. Sending data every {interval_seconds}s")
        
        try:
            while True:
                # Simulate sensor data
                sensor_data = {
                    "mq2": round(uniform(300, 400), 2),
                    "mq4": round(uniform(800, 900), 2),
                    "mq6": round(uniform(8000, 9000), 2),
                    "mq135": round(uniform(100, 150), 2),
                    "temperature": round(uniform(6, 10), 1),
                    "humidity": round(uniform(85, 95), 1),
                    "ldr": round(uniform(400, 500), 2)
                }
                
                result = self.submit_reading(sensor_data)
                
                if result.get("success"):
                    quality = result.get("quality", {})
                    grade = quality.get("grade", "N/A")
                    score = quality.get("score", 0)
                    print(f"✓ Reading sent - Grade: {grade} | Score: {score:.2f}")
                else:
                    print(f"✗ Error: {result.get('error')}")
                
                time.sleep(interval_seconds)
        
        except KeyboardInterrupt:
            print("\nSimulation stopped.")

# Usage
if __name__ == "__main__":
    client = FarmlinkIoTClient(
        "http://localhost:5000",
        "your-device-uuid"
    )
    
    # Start continuous simulation
    client.simulate_and_send(interval_seconds=10)
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Device not found" | Check device ID is correct and registered |
| Connection timeout | Verify server is running on port 5000 |
| Invalid sensor data | Ensure all sensor values are numbers |
| Build quality fails | Check sensor ranges are within optimal limits |

---

## Best Practices

1. **Submit readings every 30-60 seconds** for continuous monitoring
2. **Use batch submissions** when sending historical data
3. **Validate sensor ranges** before quality assessment
4. **Implement retry logic** for network failures
5. **Store device IDs** securely on IoT devices
6. **Monitor last_reading_at** to detect device failures
7. **Use average readings** for final grading decisions

---

Made with ❤️ by Farmlink Team
