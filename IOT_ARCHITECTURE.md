# 🏗️ Farmlink IoT System Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                          IoT DEVICES                             │
│  Arduino/ESP32/Raspberry Pi with Environmental Sensors           │
│                                                                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                        │
│  │ MQ-2,4,6 │  │ MQ-135   │  │ DHT11    │  ┌──────────┐         │
│  │ Gas Sen. │  │Air Quality│  │Temp/Hum. │  │   LDR    │         │
│  └──────────┘  └──────────┘  └──────────┘  │  Light   │         │
│       └─────────────────────────────────────┴──────────┘         │
│                           ↓                                       │
│                    [WiFi/Ethernet]                               │
└─────────────────────────────────────────────────────────────────┘
                            ↓ JSON Data
        ┌───────────────────────────────────────┐
        │    HTTP POST/GET Requests             │
        │ http://localhost:5000/api/iot/        │
        └───────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND SERVER (Node.js)                      │
│                     Port 5000                                    │
│                                                                  │
│  ┌──────────────────────────────────────────────────────┐       │
│  │ IoT Routes (iotRoutes.js)                            │       │
│  │ ├─ POST /datasets                                   │       │
│  │ ├─ POST /readings/:deviceId                         │       │
│  │ ├─ POST /readings/:deviceId/batch                   │       │
│  │ ├─ GET /readings/:deviceId/latest                   │       │
│  │ ├─ GET /readings/:deviceId/average                  │       │
│  │ └─ GET /readings/:deviceId/history                  │       │
│  └──────────────────────────────────────────────────────┘       │
│                            ↓                                     │
│  ┌──────────────────────────────────────────────────────┐       │
│  │ IoT Controller (IoTController.js)                    │       │
│  │ ├─ registerDevice()                                 │       │
│  │ ├─ submitReading()                                  │       │
│  │ ├─ getLatestReadings()                              │       │
│  │ ├─ getAverageReadings()                             │       │
│  │ ├─ calculateQualityScore()                          │       │
│  │ └─ validateSensorData()                             │       │
│  └──────────────────────────────────────────────────────┘       │
│                            ↓                                     │
│  ┌──────────────────────────────────────────────────────┐       │
│  │ IoT Device Service (IoTDeviceService.js)            │       │
│  │ ├─ registerDevice()                                 │       │
│  │ ├─ ingestSensorReading()                            │       │
│  │ ├─ validateReadings()                               │       │
│  │ ├─ calculateQualityScore()                          │       │
│  │ ├─ getLatestReadings()                              │       │
│  │ └─ getAverageReadings()                             │       │
│  └──────────────────────────────────────────────────────┘       │
│                            ↓                                     │
│  ┌──────────────────────────────────────────────────────┐       │
│  │ Data Validation & Processing                        │       │
│  │ ├─ Check sensor ranges                              │       │
│  │ ├─ Calculate quality scores                         │       │
│  │ ├─ Assign grades (A/B/C)                            │       │
│  │ └─ Generate validations                             │       │
│  └──────────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│                    PostgreSQL Database                           │
│                     Farmlink Database                            │
│                                                                  │
│  ┌──────────────────────────┐  ┌──────────────────────────────┐ │
│  │ iot_devices Table        │  │ iot_sensor_readings Table    │ │
│  │                          │  │                              │ │
│  │ ├─ id (UUID)            │  │ ├─ id (UUID)                 │ │
│  │ ├─ crop_id (FK)         │  │ ├─ device_id (FK)            │ │
│  │ ├─ device_name          │  │ ├─ crop_id (FK)              │ │
│  │ ├─ device_type          │  │ ├─ mq2_value                 │ │
│  │ ├─ status               │  │ ├─ mq4_value                 │ │
│  │ ├─ location             │  │ ├─ mq6_value                 │ │
│  │ ├─ last_reading_at      │  │ ├─ mq135_value               │ │
│  │ ├─ created_at           │  │ ├─ temperature               │ │
│  │ └─ updated_at           │  │ ├─ humidity                  │ │
│  │                          │  │ ├─ ldr_light_level           │ │
│  │ Indexes:                │  │ ├─ raw_data (JSONB)          │ │
│  │ └─ idx_crop_id          │  │ ├─ received_at               │ │
│  │                          │  │ ├─ processed_at              │ │
│  │                          │  │ │                            │ │
│  │                          │  │ Indexes:                    │ │
│  │                          │  │ ├─ idx_device_id            │ │
│  │                          │  │ ├─ idx_crop_id              │ │
│  │                          │  │ └─ idx_timestamp (DESC)      │ │
│  └──────────────────────────┘  └──────────────────────────────┘ │
│                                                                  │
│  (Other tables: users, crops, farmers, fpos, etc.)              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                            ↑
        ┌───────────────────┴───────────────────┐
        ↓                                       ↓
┌──────────────────────────────┐  ┌──────────────────────────────┐
│  FPO Dashboard (Future)      │  │  Farmlink Frontend (React)   │
│                              │  │                              │
│  ├─ Real-time sensor data    │  │  ├─ Quality Analysis        │
│  ├─ Quality trends           │  │  ├─ Transparency            │
│  ├─ Environmental alerts     │  │  ├─ Farmer History          │
│  ├─ Grade predictions        │  │  ├─ Temperature trends      │
│  ├─ Device monitoring        │  │  ├─ Alerts & notifications  │
│  └─ Historical analysis      │  │  └─ Export reports          │
│                              │  │                              │
└──────────────────────────────┘  └──────────────────────────────┘
```

---

## Data Flow - Single Reading Submission

```
IoT Device                      Backend Server                Database
─────────────────────────────────────────────────────────────────

1. Read Sensors
   MQ2=350, Temp=8.5, etc.
        │
        │ HTTP POST
        │ /api/iot/readings/:deviceId
        ├──────────────────────────→  IoTController.submitReading()
                                      │
                                      ├─ Validate device exists
                                      │
                                      └─ Call IoTDeviceService
                                         │
                                         ├─ ingestSensorReading()
                                         │
                                         ├─ Insert into DB
                                         │  ├──────────────────────→ iot_sensor_readings
                                         │  │  (INSERT)
                                         │  │
                                         │  ├──────────────────────→ Update .last_reading_at
                                         │  │  (UPDATE iot_devices)
                                         │  │
                                         │  └─ Return reading
                                         │
                                         ├─ Calculate Quality
                                         │  ├─ Check temp_optimal
                                         │  ├─ Check humidity_optimal
                                         │  ├─ Check ldr_optimal
                                         │  ├─ Check gas_acceptable
                                         │  └─ Assign grade A/B/C
                                         │
                                         └─ Return response
        ←──────────────────────────────────
        │
        │ HTTP Response
        │ {
        │   "quality": {
        │     "grade": "A",
        │     "score": 0.92
        │   }
        │ }
        │
2. Process Response
   Store reading locally
   Update dashboard
```

---

## Database Schema - IoT Tables

```sql
-- IoT Devices (One per crop sensor)
CREATE TABLE iot_devices (
  id UUID PRIMARY KEY,
  crop_id UUID REFERENCES crops(id),    -- Link to crop
  device_name VARCHAR(255),             -- "Field-1-Sensor"
  device_type VARCHAR(100),             -- "environmental_sensor"
  status VARCHAR(50),                   -- "active" or "inactive"
  location VARCHAR(255),                -- "Plot 2, Nashik"
  last_reading_at TIMESTAMP,            -- Track device health
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Sensor Readings (One per submission)
CREATE TABLE iot_sensor_readings (
  id UUID PRIMARY KEY,
  device_id UUID REFERENCES iot_devices(id),
  crop_id UUID REFERENCES crops(id),
  
  -- Individual sensor values
  mq2_value DECIMAL(10, 2),             -- 0-400 ppm (gas)
  mq4_value DECIMAL(10, 2),             -- 0-1000 ppm (gas)
  mq6_value DECIMAL(10, 2),             -- 0-10000 ppm (gas)
  mq135_value DECIMAL(10, 2),           -- 0-200 ppm (air quality)
  temperature DECIMAL(5, 2),            -- -20 to 50°C
  humidity DECIMAL(5, 2),               -- 0 to 100%
  ldr_light_level DECIMAL(5, 2),        -- 0-1023 (light)
  
  -- Raw data storage
  raw_data JSONB,                       -- Full sensor packet
  
  -- Timestamps
  received_at TIMESTAMP,                -- When server received it
  processed_at TIMESTAMP                -- When quality calculated
);

-- Indexes for Performance
CREATE INDEX idx_iot_devices_crop_id ON iot_devices(crop_id);
CREATE INDEX idx_iot_readings_device_id ON iot_sensor_readings(device_id);
CREATE INDEX idx_iot_readings_timestamp ON iot_sensor_readings(received_at DESC);
```

---

## API Request/Response Examples

### Register Device
```
REQUEST:
POST /api/iot/devices
{
  "cropId": "crop-uuid",
  "deviceName": "Farm-Sensor-01",
  "location": "Field 1"
}

RESPONSE (201 Created):
{
  "success": true,
  "device": {
    "id": "device-uuid-abc123",
    "crop_id": "crop-uuid",
    "device_name": "Farm-Sensor-01",
    "status": "active",
    "location": "Field 1",
    "created_at": "2026-04-11T10:30:00Z"
  }
}
```

### Submit Reading
```
REQUEST:
POST /api/iot/readings/device-uuid-abc123
{
  "mq2": 350,
  "mq4": 850,
  "mq6": 8500,
  "mq135": 120,
  "temperature": 8.5,
  "humidity": 90.2,
  "ldr": 450
}

RESPONSE (201 Created):
{
  "success": true,
  "reading": {
    "id": "reading-uuid",
    "device_id": "device-uuid-abc123",
    "mq2_value": 350,
    "temperature": 8.5,
    "humidity": 90.2,
    "received_at": "2026-04-11T10:35:00Z"
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
  }
}
```

### Get Latest Readings
```
REQUEST:
GET /api/iot/readings/device-uuid/latest?limit=5

RESPONSE (200 OK):
{
  "success": true,
  "readings": [
    {
      "id": "reading-1",
      "temperature": 8.5,
      "humidity": 90.2,
      "mq2_value": 350,
      "received_at": "2026-04-11T10:35:00Z"
    },
    {
      "id": "reading-2",
      "temperature": 8.4,
      "humidity": 90.1,
      "mq2_value": 348,
      "received_at": "2026-04-11T10:05:00Z"
    }
  ],
  "count": 2
}
```

### Get Average Readings
```
REQUEST:
GET /api/iot/readings/device-uuid/average?minutesBack=60

RESPONSE (200 OK):
{
  "success": true,
  "averages": {
    "avg_mq2": 348.5,
    "avg_temperature": 8.45,
    "avg_humidity": 90.15,
    "reading_count": 60
  },
  "quality": {
    "score": 0.90,
    "grade": "A"
  },
  "period_minutes": 60
}
```

---

## Quality Scoring Algorithm

```
function calculateQualityScore(reading) {
  let score = 100;
  
  // Temperature validation: 0-10°C optimal
  if (reading.temperature < 0 || reading.temperature > 10) {
    score -= 15;  // -15% penalty
  }
  
  // Humidity validation: 85-95% optimal
  if (reading.humidity < 85 || reading.humidity > 95) {
    score -= 15;  // -15% penalty
  }
  
  // Light validation: < 500 Lux optimal
  if (reading.ldr > 500) {
    score -= 10;  // -10% penalty
  }
  
  // Gas validation
  if (reading.mq2 >= 400 || 
      reading.mq4 >= 1000 || 
      reading.mq6 >= 10000) {
    score -= 25;  // -25% penalty
  }
  
  // Normalize 0-100 and convert to percentage
  score = Math.max(0, Math.min(100, score)) / 100;
  
  // Assign grade
  if (score >= 0.85) return { grade: 'A', score };
  if (score >= 0.65) return { grade: 'B', score };
  return { grade: 'C', score };
}
```

---

## Sensor Range Reference

```
┌─────────────────────────────────────────────┐
│        SENSOR MEASUREMENT RANGES            │
├─────────────────────────────────────────────┤
│                                             │
│ Temperature (DHT11)                         │
│ ├─ Measurement Range: -40°C to +80°C        │
│ ├─ Accuracy: ±2°C                           │
│ ├─ Optimal for Grapes: 0°C to 10°C          │
│ └─ Grade Impact: ±15% if out of range       │
│                                             │
│ Humidity (DHT11)                            │
│ ├─ Measurement Range: 0% to 100%            │
│ ├─ Accuracy: ±5%                            │
│ ├─ Optimal for Grapes: 85% to 95%           │
│ └─ Grade Impact: ±15% if out of range       │
│                                             │
│ Gas Sensor - MQ-2 (LPG, Alcohol)            │
│ ├─ Measurement Range: 0-1000 ppm            │
│ ├─ Good Level: < 400 ppm                    │
│ └─ Grade Impact: -25% if exceeds 400        │
│                                             │
│ Gas Sensor - MQ-4 (Methane/CNG)             │
│ ├─ Measurement Range: 200-10000 ppm         │
│ ├─ Good Level: < 1000 ppm                   │
│ └─ Grade Impact: -25% if exceeds 1000       │
│                                             │
│ Gas Sensor - MQ-6 (LPG/Butane)              │
│ ├─ Measurement Range: 4000-10000+ ppm       │
│ ├─ Good Level: < 10000 ppm                  │
│ └─ Grade Impact: -25% if exceeds 10000      │
│                                             │
│ Gas Sensor - MQ-135 (Air Quality)           │
│ ├─ Measurement Range: 10-1000 ppm           │
│ ├─ Good Level: < 150 ppm                    │
│ └─ Grade Impact: -25% if high               │
│                                             │
│ Light Sensor - LDR                          │
│ ├─ Measurement Range: 0-1023 (analog)       │
│ ├─ Lux Conversion: × (5000/1023)             │
│ ├─ Optimal for Storage: < 500 Lux           │
│ └─ Grade Impact: -10% if exceeds 500        │
│                                             │
└─────────────────────────────────────────────┘
```

---

## Continuous Data Collection Pattern

```
Timeline of Grape Storage Monitoring:

Day 1
├─ 09:00 Device activated, first reading
├─ 09:30 Reading 2
├─ 10:00 Reading 3
├─ ...continues every 30 seconds...
└─ 12:00 Reading 60 → Calculate 1-hour average

Day 2-7: Continue monitoring
├─ Daily quality tracking
├─ Alert if conditions worsen
└─ Archive readings to database

Quality Assessment
├─ Calculate hourly averages
├─ Track trends
├─ Generate daily report
└─ Assign final grade based on all data
```

---

## Integration Points

```
┌─────────────────────────────────────┐
│  Existing Farmlink Systems          │
├─────────────────────────────────────┤
│                                     │
│  1. FPO Dashboard                   │
│     ├─ Add IoT monitoring page      │
│     ├─ Display real-time data       │
│     ├─ Show quality trends          │
│     └─ Generate certificates       │
│                                     │
│  2. Crop Management                 │
│     ├─ Link IoT devices to crops    │
│     ├─ Track during storage         │
│     └─ Update quality scores        │
│                                     │
│  3. Quality Grading                 │
│     ├─ Use IoT data in final score  │
│     ├─ 30% weight from sensors      │
│     └─ 70% weight from image        │
│                                     │
│  4. Transparency System             │
│     ├─ Show environmental data      │
│     ├─ Include sensor readings      │
│     └─ Prove storage conditions     │
│                                     │
│  5. Notifications                   │
│     ├─ Alert on bad conditions      │
│     ├─ Notify FPO immediately       │
│     └─ Track corrective actions     │
│                                     │
└─────────────────────────────────────┘
```

---

## Performance Considerations

```
Database Query Optimization:

✓ Indexes on frequently queried columns
  ├─ device_id (for device-specific queries)
  ├─ crop_id (for crop aggregations)
  └─ received_at DESC (for time-series queries)

✓ Batch insertion for multiple readings
  ├─ ~1000x faster than individual inserts
  ├─ Reduces network overhead
  └─ Better for data loggers

✓ Time-based queries
  ├─ Limit historical queries to recent data
  ├─ Archive old data annually
  └─ Use averages instead of raw data

✓ Connection pooling
  ├─ Reuse database connections
  ├─ Handle concurrent devices
  └─ Prevent "too many connections" error
```

---

Made with ❤️ by Farmlink Team

_Document Version: 1.0 | Last Updated: April 11, 2026_
