#!/usr/bin/env python3
"""
Farmlink IoT API Testing Script
Quick test to verify IoT endpoints are working
"""

import requests
import json
import time
from datetime import datetime

BASE_URL = "http://localhost:5000/api/iot"
CROP_ID = "test-crop-uuid"  # Replace with actual crop ID from your system

def print_response(title, response_json):
    """Pretty print API response"""
    print(f"\n{'='*60}")
    print(f"✓ {title}")
    print(f"{'='*60}")
    print(json.dumps(response_json, indent=2))

def test_device_registration():
    """Test 1: Register IoT Device"""
    print("\n🔧 TEST 1: Register IoT Device")
    
    payload = {
        "cropId": CROP_ID,
        "deviceName": "Test-Sensor-001",
        "deviceType": "environmental_sensor",
        "location": "Test Field A"
    }
    
    response = requests.post(f"{BASE_URL}/devices", json=payload)
    
    if response.status_code == 201:
        data = response.json()
        print_response("Device Registered Successfully", data)
        return data['device']['id']  # Return device ID for further tests
    else:
        print(f"✗ Failed: {response.status_code}")
        print(response.text)
        return None

def test_get_device(device_id):
    """Test 2: Get Device Info"""
    print("\n🔍 TEST 2: Get Device Information")
    
    response = requests.get(f"{BASE_URL}/devices/{device_id}")
    
    if response.status_code == 200:
        data = response.json()
        print_response("Device Info Retrieved", data)
    else:
        print(f"✗ Failed: {response.status_code}")
        print(response.text)

def test_submit_single_reading(device_id):
    """Test 3: Submit Single Sensor Reading"""
    print("\n📊 TEST 3: Submit Single Sensor Reading")
    
    # Simulate realistic sensor data (within optimal ranges for Grade A)
    payload = {
        "mq2": 350,           # < 400 (good)
        "mq4": 850,           # < 1000 (good)
        "mq6": 8500,          # < 10000 (good)
        "mq135": 120,         # Low levels (good)
        "temperature": 8.5,   # 0-10°C range (good)
        "humidity": 90.2,     # 85-95% range (good)
        "ldr": 450            # < 500 Lux (good)
    }
    
    response = requests.post(f"{BASE_URL}/readings/{device_id}", json=payload)
    
    if response.status_code == 201:
        data = response.json()
        print_response("Single Reading Submitted", data)
        print(f"\n   Grade: {data['quality']['grade']}")
        print(f"   Score: {data['quality']['score']:.2%}")
        print(f"   Validation: {data['quality']['validation']}")
    else:
        print(f"✗ Failed: {response.status_code}")
        print(response.text)

def test_batch_submit_readings(device_id):
    """Test 4: Batch Submit Multiple Readings"""
    print("\n📦 TEST 4: Batch Submit Multiple Readings")
    
    readings = [
        {
            "mq2": 340,
            "mq4": 840,
            "mq6": 8400,
            "mq135": 115,
            "temperature": 8.3,
            "humidity": 89.8,
            "ldr": 440
        },
        {
            "mq2": 360,
            "mq4": 860,
            "mq6": 8600,
            "mq135": 125,
            "temperature": 8.7,
            "humidity": 90.5,
            "ldr": 460
        },
        {
            "mq2": 350,
            "mq4": 850,
            "mq6": 8500,
            "mq135": 120,
            "temperature": 8.5,
            "humidity": 90.2,
            "ldr": 450
        }
    ]
    
    payload = {"readings": readings}
    
    response = requests.post(f"{BASE_URL}/readings/{device_id}/batch", json=payload)
    
    if response.status_code == 201:
        data = response.json()
        print_response("Batch Readings Submitted", data)
        print(f"\n   Readings submitted: {data['count']}")
    else:
        print(f"✗ Failed: {response.status_code}")
        print(response.text)

def test_get_latest_readings(device_id):
    """Test 5: Get Latest Readings"""
    print("\n📈 TEST 5: Get Latest Readings")
    
    response = requests.get(f"{BASE_URL}/readings/{device_id}/latest", 
                           params={"limit": 5})
    
    if response.status_code == 200:
        data = response.json()
        print_response("Latest Readings Retrieved", data)
    else:
        print(f"✗ Failed: {response.status_code}")
        print(response.text)

def test_get_history(device_id):
    """Test 6: Get Historical Data"""
    print("\n⏰ TEST 6: Get Historical Readings (Last 24 hours)")
    
    response = requests.get(f"{BASE_URL}/readings/{device_id}/history",
                           params={"hoursBack": 24, "limit": 50})
    
    if response.status_code == 200:
        data = response.json()
        print_response("Historical Readings Retrieved", data)
    else:
        print(f"✗ Failed: {response.status_code}")
        print(response.text)

def test_get_averages(device_id):
    """Test 7: Get Average Readings"""
    print("\n📊 TEST 7: Get Average Readings (Last 60 minutes)")
    
    response = requests.get(f"{BASE_URL}/readings/{device_id}/average",
                           params={"minutesBack": 60})
    
    if response.status_code == 200:
        data = response.json()
        print_response("Average Readings", data)
    else:
        print(f"✗ Failed: {response.status_code}")
        print(response.text)

def test_stream_readings(device_id):
    """Test 8: Stream/Poll Readings"""
    print("\n🌊 TEST 8: Stream Readings (Poll for New Data)")
    
    response = requests.get(f"{BASE_URL}/readings/{device_id}/stream")
    
    if response.status_code == 200:
        data = response.json()
        print_response("Streamed Readings", data)
    else:
        print(f"✗ Failed: {response.status_code}")
        print(response.text)

def test_get_crop_devices():
    """Test 9: Get All Devices for Crop"""
    print("\n📱 TEST 9: Get All Devices for Crop")
    
    response = requests.get(f"{BASE_URL}/crop/{CROP_ID}/devices")
    
    if response.status_code == 200:
        data = response.json()
        print_response("Crop Devices", data)
    else:
        print(f"✗ Failed: {response.status_code}")
        print(response.text)

def test_continuous_simulation(device_id, duration_seconds=60, interval_seconds=10):
    """Test 10: Continuous Simulation"""
    print(f"\n🔄 TEST 10: Continuous Simulation ({duration_seconds}s)")
    print(f"   Sending data every {interval_seconds} seconds...")
    
    import random
    
    start_time = time.time()
    count = 0
    
    while time.time() - start_time < duration_seconds:
        # Generate slightly varying sensor data
        sensor_data = {
            "mq2": round(350 + random.uniform(-20, 20), 2),
            "mq4": round(850 + random.uniform(-30, 30), 2),
            "mq6": round(8500 + random.uniform(-500, 500), 2),
            "mq135": round(120 + random.uniform(-10, 10), 2),
            "temperature": round(8.5 + random.uniform(-0.5, 0.5), 1),
            "humidity": round(90.2 + random.uniform(-2, 2), 1),
            "ldr": round(450 + random.uniform(-30, 30), 2)
        }
        
        response = requests.post(f"{BASE_URL}/readings/{device_id}", json=sensor_data)
        
        if response.status_code == 201:
            data = response.json()
            grade = data['quality']['grade']
            score = data['quality']['score']
            count += 1
            elapsed = int(time.time() - start_time)
            print(f"   [{elapsed}s] Reading #{count} - Grade: {grade} | Score: {score:.2%}")
        else:
            print(f"   ✗ Error submitting reading")
        
        time.sleep(interval_seconds)
    
    print(f"\n   ✓ Sent {count} readings successfully!")

def main():
    """Run all tests"""
    print("\n" + "="*60)
    print("🌱 FARMLINK IoT API TESTING SUITE")
    print("="*60)
    print(f"\nServer: {BASE_URL}")
    print(f"Crop ID: {CROP_ID}")
    print(f"Server Status: ", end="")
    
    # Check server health
    try:
        response = requests.get("http://localhost:5000/health", timeout=2)
        if response.status_code == 200:
            print("✓ Running\n")
        else:
            print("✗ Not responding correctly")
            return
    except:
        print("✗ Cannot connect to server")
        print("\nMake sure backend is running: npm run dev")
        return
    
    # Run tests in sequence
    try:
        # Test 1: Register device
        device_id = test_device_registration()
        
        if device_id:
            # Wait a moment for device to be created
            time.sleep(1)
            
            # Test 2: Get device info
            test_get_device(device_id)
            
            # Test 3: Submit single reading
            test_submit_single_reading(device_id)
            
            # Test 4: Batch submit
            test_batch_submit_readings(device_id)
            
            # Test 5: Get latest
            test_get_latest_readings(device_id)
            
            # Test 6: Get history
            test_get_history(device_id)
            
            # Test 7: Get averages
            test_get_averages(device_id)
            
            # Test 8: Stream
            test_stream_readings(device_id)
            
            # Test 9: Get crop devices
            test_get_crop_devices()
            
            # Test 10: Continuous simulation (30 seconds, 5 second interval)
            test_continuous_simulation(device_id, duration_seconds=30, interval_seconds=5)
            
            print("\n" + "="*60)
            print("✓ ALL TESTS COMPLETED SUCCESSFULLY!")
            print("="*60)
        else:
            print("\n✗ Device registration failed. Cannot continue tests.")
    
    except Exception as e:
        print(f"\n✗ Test error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
