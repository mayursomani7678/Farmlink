// Test that mimics frontend registration exactly
const axios = require('axios');

const apiClient = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 30000 // 30 second timeout
});

// Add response logging like frontend
apiClient.interceptors.response.use(
  (response) => {
    console.log(`✅ [API] Response ${response.status} from ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error(`❌ [API] Error from ${error.config?.url}:`, {
      status: error.response?.status,
      statusText: error.response?.statusText,
      message: error.message
    });
    return Promise.reject(error);
  }
);

async function testRegistration() {
  try {
    console.log('📝 [TEST] Starting registration test...');
    
    const formData = {
      email: 'testuser@test.com',
      password: 'Test@123',
      fullName: 'Test User',
      userType: 'fpo',
      phone: '9876543210',
      location: 'Test City'
    };
    
    console.log('📝 [TEST] Form data:', formData);
    console.log('📤 [TEST] Sending registration request...');
    
    const response = await apiClient.post('/auth/register', formData);
    
    console.log('✅ [TEST] Registration successful!');
    console.log('✅ [TEST] Response status:', response.status);
    console.log('✅ [TEST] User ID:', response.data.user.id);
    console.log('✅ [TEST] Email:', response.data.user.email);
    console.log('✅ [TEST] Token received:', response.data.token ? 'Yes (length: ' + response.data.token.length + ')' : 'No');
    
  } catch (error) {
    console.error('❌ [TEST] Registration failed:');
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testRegistration();
