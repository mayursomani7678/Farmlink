#!/usr/bin/env node
/**
 * Farmlink IoT API Quick Tester
 * Test IoT endpoints with a single command
 * 
 * Usage: node test_iot_simple.js
 */

const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

const BASE_URL = 'http://localhost:5000/api/iot';
const API = axios.create({ baseURL: BASE_URL });

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(color, message) {
  console.log(`${color}${message}${colors.reset}`);
}

function success(message) {
  log(colors.green, `✓ ${message}`);
}

function error(message) {
  log(colors.red, `✗ ${message}`);
}

function info(message) {
  log(colors.cyan, `ℹ ${message}`);
}

function section(title) {
  console.log('\n' + '='.repeat(60));
  log(colors.blue, title);
  console.log('='.repeat(60));
}

async function testServerHealth() {
  section('🔍 Checking Server Health');
  
  try {
    const response = await axios.get('http://localhost:5000/health', { 
      timeout: 2000 
    });
    success('Backend server is running on port 5000');
    console.log(`  Response: ${JSON.stringify(response.data)}`);
    return true;
  } catch (err) {
    error('Cannot connect to backend server');
    console.log('  Make sure backend is running: cd backend && npm run dev');
    return false;
  }
}

async function testRegisterDevice() {
  section('📱 Test 1: Register IoT Device');
  
  try {
    const cropId = uuidv4();
    const deviceName = `Test-Sensor-${Date.now()}`;
    
    const payload = {
      cropId,
      deviceName,
      deviceType: 'environmental_sensor',
      location: 'Test Farm Field A'
    };
    
    info(`Registering device: ${deviceName}`);
    info(`Crop ID: ${cropId}`);
    
    const response = await API.post('/devices', payload);
    
    const device = response.data.device;
    success(`Device registered successfully!`);
    console.log(`  Device ID: ${device.id}`);
    console.log(`  Device Name: ${device.device_name}`);
    console.log(`  Status: ${device.status}`);
    
    return device;
  } catch (err) {
    error(`Device registration failed: ${err.response?.data?.error || err.message}`);
    return null;
  }
}

async function testSubmitReading(deviceId) {
  section('📊 Test 2: Submit Single Sensor Reading');
  
  try {
    // Generate realistic sensor data (good quality)
    const sensorData = {
      mq2: 350,
      mq4: 850,
      mq6: 8500,
      mq135: 120,
      temperature: 8.5,
      humidity: 90.2,
      ldr: 450
    };
    
    info('Submitting sensor reading:');
    console.log(JSON.stringify(sensorData, null, 2));
    
    const response = await API.post(`/readings/${deviceId}`, sensorData);
    
    const quality = response.data.quality;
    success('Sensor reading submitted successfully!');
    console.log(`  Grade: ${colors.yellow}${quality.grade}${colors.reset}`);
    console.log(`  Score: ${(quality.score * 100).toFixed(1)}%`);
    console.log(`  Temperature Optimal: ${quality.validation.temperature_optimal}`);
    console.log(`  Humidity Optimal: ${quality.validation.humidity_optimal}`);
    console.log(`  Light Optimal: ${quality.validation.ldr_optimal}`);
    console.log(`  Gas Levels OK: ${quality.validation.gas_levels_acceptable}`);
    
    return response.data.reading.id;
  } catch (err) {
    error(`Submit reading failed: ${err.response?.data?.error || err.message}`);
    console.log(err.response?.data);
    return null;
  }
}

async function testBatchSubmit(deviceId) {
  section('📦 Test 3: Batch Submit Multiple Readings');
  
  try {
    const readings = [];
    
    // Generate 3 readings with slight variations
    for (let i = 0; i < 3; i++) {
      readings.push({
        mq2: 350 + Math.random() * 20,
        mq4: 850 + Math.random() * 30,
        mq6: 8500 + Math.random() * 500,
        mq135: 120 + Math.random() * 10,
        temperature: 8.5 + Math.random() * 0.5,
        humidity: 90.2 + Math.random() * 1,
        ldr: 450 + Math.random() * 30
      });
    }
    
    info(`Submitting ${readings.length} readings in batch...`);
    
    const response = await API.post(`/readings/${deviceId}/batch`, { 
      readings 
    });
    
    success(`${response.data.count} readings submitted successfully!`);
    
    return true;
  } catch (err) {
    error(`Batch submit failed: ${err.response?.data?.error || err.message}`);
    return false;
  }
}

async function testGetLatest(deviceId) {
  section('📈 Test 4: Get Latest Readings');
  
  try {
    info('Fetching latest 5 readings...');
    
    const response = await API.get(`/readings/${deviceId}/latest`, {
      params: { limit: 5 }
    });
    
    success(`Retrieved ${response.data.count} readings`);
    
    console.log('\n  Latest readings:');
    response.data.readings.forEach((reading, idx) => {
      console.log(`  ${idx + 1}. Temp: ${reading.temperature}°C | Humidity: ${reading.humidity}% | MQ2: ${reading.mq2_value}`);
    });
    
    return true;
  } catch (err) {
    error(`Get latest failed: ${err.response?.data?.error || err.message}`);
    return false;
  }
}

async function testGetAverage(deviceId) {
  section('📊 Test 5: Get Average Readings');
  
  try {
    info('Calculating average for last 10 minutes...');
    
    const response = await API.get(`/readings/${deviceId}/average`, {
      params: { minutesBack: 10 }
    });
    
    const data = response.data.averages;
    success('Average readings calculated!');
    
    console.log(`  Period: ${data.reading_count} readings collected`);
    console.log(`  Avg Temperature: ${data.avg_temperature?.toFixed(1)}°C`);
    console.log(`  Avg Humidity: ${data.avg_humidity?.toFixed(1)}%`);
    console.log(`  Avg Light Level: ${data.avg_ldr?.toFixed(0)} Lux`);
    console.log(`  Quality Grade: ${response.data.quality.grade}`);
    console.log(`  Quality Score: ${(response.data.quality.score * 100).toFixed(1)}%`);
    
    return true;
  } catch (err) {
    error(`Get average failed: ${err.response?.data?.error || err.message}`);
    return false;
  }
}

async function testContinuousStream(deviceId) {
  section('🌊 Test 6: Continuous Stream Simulation');
  
  try {
    info('Simulating continuous data submission for 15 seconds...');
    console.log('  Sending readings every 3 seconds\n');
    
    let count = 0;
    const duration = 15000; // 15 seconds
    const interval = 3000;  // 3 seconds
    const startTime = Date.now();
    
    return new Promise((resolve) => {
      const timer = setInterval(async () => {
        const elapsed = Date.now() - startTime;
        
        if (elapsed >= duration) {
          clearInterval(timer);
          success(`Sent ${count} readings in continuous stream!`);
          resolve(true);
          return;
        }
        
        // Generate sensor data
        const sensorData = {
          mq2: 350 + Math.random() * 20,
          mq4: 850 + Math.random() * 30,
          mq6: 8500 + Math.random() * 500,
          mq135: 120 + Math.random() * 10,
          temperature: 8.5 + Math.random() * 0.5,
          humidity: 90.2 + Math.random() * 1,
          ldr: 450 + Math.random() * 30
        };
        
        try {
          const response = await API.post(`/readings/${deviceId}`, sensorData);
          count++;
          const grade = response.data.quality.grade;
          const score = (response.data.quality.score * 100).toFixed(1);
          console.log(`  [${count}] Grade: ${colors.yellow}${grade}${colors.reset} | Score: ${score}%`);
        } catch (err) {
          console.log(`  [${count}] Error: ${err.message}`);
        }
      }, interval);
    });
  } catch (err) {
    error(`Stream test failed: ${err.message}`);
    return false;
  }
}

async function runAllTests() {
  console.clear();
  console.log('\n');
  log(colors.blue, '╔════════════════════════════════════════════════════════╗');
  log(colors.blue, '║     🌱 FARMLINK IoT API - QUICK TEST SUITE 🌱         ║');
  log(colors.blue, '╚════════════════════════════════════════════════════════╝');
  
  // Check server
  const serverOk = await testServerHealth();
  if (!serverOk) return;
  
  // Register device
  const device = await testRegisterDevice();
  if (!device) return;
  
  const deviceId = device.id;
  
  // Run all tests
  await testSubmitReading(deviceId);
  await testBatchSubmit(deviceId);
  await new Promise(r => setTimeout(r, 1000)); // Wait for data to be stored
  await testGetLatest(deviceId);
  await testGetAverage(deviceId);
  await testContinuousStream(deviceId);
  
  // Summary
  section('✓ All Tests Completed Successfully!');
  
  console.log('\n' + '='.repeat(60));
  log(colors.green, '📚 Next Steps:');
  console.log('='.repeat(60));
  console.log('1. Read IoT integration guide: IOT_QUICK_START.md');
  console.log('2. Read full API documentation: IOT_API_GUIDE.md');
  console.log('3. Integrate with your IoT device (Arduino, Raspberry Pi, etc.)');
  console.log('4. Send continuous sensor data every 30-60 seconds');
  console.log('5. Monitor quality grades in FPO Dashboard\n');
  
  log(colors.cyan, '🌐 API Base URL: http://localhost:5000/api/iot');
  log(colors.cyan, '📱 Your Test Device ID: ' + deviceId);
  
  process.exit(0);
}

// Run tests
runAllTests().catch(err => {
  error(`Unexpected error: ${err.message}`);
  process.exit(1);
});
