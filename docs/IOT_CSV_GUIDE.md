# IoT Sensor CSV Format Guide

## Overview
IoT sensor data should be uploaded as CSV files containing readings from various sensors monitoring the crop storage environment.

## Sensors Used

### Gas Detection Sensors
- **MQ2:** Detects methane, hydrogen, carbon monoxide, etc.
- **MQ4:** Detects methane (CH₄)
- **MQ6:** Detects LPG and other gases
- **MQ135:** Detects air quality (NH3, NOx, alcohol, benzene, smoke, CO2)

### Environmental Sensors
- **DHT11:** Temperature and Humidity sensor
- **LDR:** Light Dependent Resistor (light level)

## CSV Format

### Required Columns
```
timestamp, mq2, mq4, mq6, mq135, temperature, humidity, ldr
```

### Data Types & Ranges

| Sensor | Column | Unit | Min | Max | Description |
|--------|--------|------|-----|-----|-------------|
| MQ2 | mq2 | PPM | 0 | 1000 | Combustible gas concentration |
| MQ4 | mq4 | PPM | 0 | 500 | Methane concentration |
| MQ6 | mq6 | PPM | 0 | 500 | LPG concentration |
| MQ135 | mq135 | PPM | 0 | 1000 | Air quality index |
| DHT11 | temperature | °C | 0 | 50 | Storage temperature |
| DHT11 | humidity | % | 0 | 100 | Relative humidity |
| LDR | ldr | Lux | 0 | 5000 | Light level |

## Example CSV File

```csv
timestamp,mq2,mq4,mq6,mq135,temperature,humidity,ldr
2024-04-11T08:00:00Z,105.2,42.5,48.1,55.3,7.5,92.1,120
2024-04-11T08:15:00Z,103.8,43.1,49.2,56.1,7.6,91.8,125
2024-04-11T08:30:00Z,104.5,42.8,48.5,55.8,7.4,92.3,118
2024-04-11T08:45:00Z,106.1,41.9,47.9,55.0,7.7,91.5,130
2024-04-11T09:00:00Z,102.3,44.2,50.1,57.2,7.3,92.5,115
2024-04-11T09:15:00Z,107.8,40.5,46.8,54.1,7.8,91.2,135
2024-04-11T09:30:00Z,101.5,45.1,51.3,58.5,7.5,92.0,110
2024-04-11T09:45:00Z,108.2,39.8,46.2,53.5,7.9,90.8,140
```

## Optimal Storage Conditions for Grapes

Based on cold chain best practices:

| Parameter | Optimal Range | Quality Threshold |
|-----------|---------------|--------------------|
| Temperature | 0-10°C | ±2°C variance |
| Humidity | 85-95% | Prevents dehydration |
| Light Level | <500 Lux | Preserves anthocyanins |
| MQ2 (Gas) | <100 PPM | Low combustion risk |
| MQ135 (Air Quality) | <50 PPM | Good air quality |

## Quality Score Calculation

### Environmental Quality Score = (T_score × 0.3) + (H_score × 0.3) + (L_score × 0.2) + (G_score × 0.2)

Where:
- **T_score:** Temperature adherence (0-1)
- **H_score:** Humidity adherence (0-1)
- **L_score:** Light level score (0-1, lower light = higher score)
- **G_score:** Gas quality score (0-1, lower gas = higher score)

### Example Calculation

```
Temperature: 8.5°C (Optimal range: 0-10°C) → Score: 1.0
Humidity: 91%  (Optimal range: 85-95%) → Score: 1.0
Light: 120 Lux (Optimal: <500) → Score: 1.0
Gas: 104 PPM   (Optimal: <100) → Score: 0.8

Environmental Quality = (1.0 × 0.3) + (1.0 × 0.3) + (1.0 × 0.2) + (0.8 × 0.2)
                      = 0.3 + 0.3 + 0.2 + 0.16
                      = 0.96 (Grade A)
```

## Grade Assignment

Based on Environmental Quality Score:

| Grade | Score Range | Environment Quality |
|-------|-------------|---------------------|
| A | 0.80-1.00 | Excellent storage conditions |
| B | 0.60-0.79 | Acceptable conditions |
| C | < 0.60 | Poor conditions |

## Creating Your CSV File

### Using Python

```python
import csv
from datetime import datetime, timedelta

# Create CSV with sensor readings
readings = []
start_time = datetime(2024, 4, 11, 8, 0, 0)

for i in range(16):  # 4 hours of 15-min readings
    timestamp = start_time + timedelta(minutes=i*15)
    reading = {
        'timestamp': timestamp.isoformat() + 'Z',
        'mq2': 100 + (i % 5) * 2,  # Variable reading
        'mq4': 42 + (i % 8),
        'mq6': 48 + (i % 6),
        'mq135': 55 + (i % 5),
        'temperature': 7.5 + (i % 3) * 0.1,
        'humidity': 91.5 + (i % 4) * 0.2,
        'ldr': 120 + (i % 20)
    }
    readings.append(reading)

# Write to CSV
with open('iot_data.csv', 'w', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=['timestamp', 'mq2', 'mq4', 'mq6', 'mq135', 'temperature', 'humidity', 'ldr'])
    writer.writeheader()
    writer.writerows(readings)

print("✅ CSV created: iot_data.csv")
```

### Using Excel/LibreOffice

1. Create new spreadsheet
2. Add headers in first row
3. Fill sensor data
4. Export as CSV

## Uploading to Farmlink

1. Go to FPO Dashboard
2. Select crop
3. Click "Upload IoT Data"
4. Select your CSV file
5. System will parse and generate IoT certificate

## Troubleshooting

### "Invalid CSV Format"
- Ensure column names match exactly (case-sensitive)
- Check for extra spaces in headers
- Verify all data types are numeric

### "Timestamp Format Error"
- Use ISO 8601 format: `YYYY-MM-DDTHH:MM:SSZ`
- Example: `2024-04-11T08:00:00Z`

### "Out of Range Values"
- Verify sensor values are within expected ranges
- Check sensor calibration
- Ensure decimal points are used (not commas)

## Integration with Real IoT Devices

For live IoT integration:

```javascript
// Node.js example - reading from IoT device
const mqtt = require('mqtt');

const client = mqtt.connect('mqtt://broker.example.com');

client.on('message', (topic, message) => {
  const sensorData = JSON.parse(message);
  
  // Process sensor data
  // Build CSV row
  // Store or upload
});
```

---

**For support:** [Farmlink Documentation](/)
