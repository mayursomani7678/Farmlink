import axios from 'axios';

// Smart API URL detection
const getAPIBaseURL = () => {
  // If env variable is set, use it
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  // If running locally on localhost, use localhost:5000
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:5000/api';
  }
  
  // For remote/forwarded URLs, use current hostname with port 5000
  const protocol = window.location.protocol;
  const hostname = window.location.hostname;
  return `${protocol}//${hostname}:5000/api`;
};

const API_BASE_URL = getAPIBaseURL();

console.log(`🔌 [API] Using API base URL: ${API_BASE_URL}`);

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 30000 // 30 second timeout
});

// Add token to every request
apiClient.interceptors.request.use((config) => {
  console.log(`📤 [API] ${config.method.toUpperCase()} ${config.url}`);
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for logging
apiClient.interceptors.response.use(
  (response) => {
    console.log(`✅ [API] Response ${response.status} from ${response.config.url}`);
    return response;
  },
  (error) => {
    const errorInfo = {
      status: error.response?.status,
      statusText: error.response?.statusText,
      message: error.message,
      code: error.code,
      url: error.config?.url,
      timeout: error.config?.timeout
    };
    
    console.error(`❌ [API] Error from ${error.config?.url}:`, errorInfo);
    
    // Log additional details for network errors
    if (error.code === 'ECONNREFUSED') {
      console.error('⚠️  [API] Connection refused - Backend may not be running on', API_BASE_URL);
    } else if (error.code === 'ENOTFOUND') {
      console.error('⚠️  [API] Cannot resolve hostname for', API_BASE_URL);
    } else if (error.message === 'timeout of 30000ms exceeded') {
      console.error('⚠️  [API] Request timeout - Server took too long to respond');
    }
    
    return Promise.reject(error);
  }
);

// Auth Services
export const authService = {
  register: (userData) => apiClient.post('/auth/register', userData),
  login: (email, password) => apiClient.post('/auth/login', { email, password }),
  getProfile: () => apiClient.get('/auth/profile'),
  updateProfile: (userData) => apiClient.put('/auth/profile', userData)
};

// FPO Services
export const fpoService = {
  getDashboard: (fpoId) => fpoId 
    ? apiClient.get(`/fpo/dashboard?fpoId=${fpoId}`)
    : apiClient.get('/fpo/dashboard'),
  createFarmer: (farmerData, fpoId) => apiClient.post('/fpo/farmers', farmerData),
  getFarmers: (fpoId) => fpoId 
    ? apiClient.get(`/fpo/farmers?fpoId=${fpoId}`)
    : apiClient.get('/fpo/farmers'),
  createCrop: (cropData) => apiClient.post('/fpo/crops', cropData),
  getCropsByFPO: (fpoId) => fpoId 
    ? apiClient.get(`/fpo/crops?fpoId=${fpoId}`)
    : apiClient.get('/fpo/crops'),
  getIoTDataForCrop: (cropId) => apiClient.get(`/fpo/crops/${cropId}/iot-data`),
  getIoTCertificateForCrop: (cropId) => apiClient.get(`/fpo/crops/${cropId}/iot-certificate`),
  analyzeImage: (formData) => apiClient.post('/fpo/analyze-image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  uploadIoTCertificate: (formData) => apiClient.post('/fpo/upload-iot-certificate', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  generateGrade: (gradeData) => apiClient.post('/fpo/generate-grade', gradeData),
  createIoTCertificate: (iotData) => apiClient.post('/fpo/create-iot-certificate', iotData),
  createListing: (listingData) => apiClient.post('/fpo/listings', listingData),
  getListingsForFarmer: (farmerId) => apiClient.get(`/fpo/farmers/${farmerId}/listings`),
  getPayments: () => apiClient.get('/fpo/payments'),
  createPayment: (paymentData) => apiClient.post('/fpo/payments', paymentData),
  updatePaymentStatus: (paymentId, status) => apiClient.put(`/fpo/payments/${paymentId}`, { status }),
  markPaymentPaid: (paymentId) => apiClient.patch(`/fpo/payments/${paymentId}/paid`, {})
};

// Buyer Services
export const buyerService = {
  getMarketplace: (filters) => apiClient.get('/buyer/marketplace', { params: filters }),
  getListingDetails: (listingId) => apiClient.get(`/buyer/listings/${listingId}`),
  buyProduct: (buyData) => apiClient.post('/buyer/buy', buyData),
  getTransactionHistory: () => apiClient.get('/buyer/transactions'),
  getTransparencyReport: (transactionId) => apiClient.get(`/buyer/transparency/${transactionId}`),
  getWallet: () => apiClient.get('/payment/wallet')
};

// Payment Services
export const paymentService = {
  getBuyerWallet: () => apiClient.get('/payment/wallet'),
  createPurchase: (purchaseData) => apiClient.post('/payment/purchases', purchaseData),
  getBuyerPurchases: () => apiClient.get('/payment/purchases'),
  markPurchaseReceived: (purchaseId) => apiClient.patch(`/payment/purchases/${purchaseId}/received`),
  getFarmerPayments: (farmerId) => apiClient.get(`/payment/payments/farmer/${farmerId}`),
  markPaymentAsGiven: (paymentId) => apiClient.patch(`/payment/payments/${paymentId}/given`)
};

// Transparency Services (Public - No Auth Required)
export const transparencyService = {
  getFarmerHistory: (farmerId) => 
    axios.get(`${API_BASE_URL}/transparency/farmer/${farmerId}`),
  getPriceHistory: (farmerId) => 
    axios.get(`${API_BASE_URL}/transparency/farmer/${farmerId}/prices`),
  getTransactionTrace: (transactionId) => 
    axios.get(`${API_BASE_URL}/transparency/trace/${transactionId}`)
};

// Mandi Prices Services (Public - No Auth Required)
export const mandiService = {
  getAllPrices: () => axios.get(`${API_BASE_URL}/mandi/all`),
  getPricesByCommodity: (commodity) => axios.get(`${API_BASE_URL}/mandi/commodity/${commodity}`),
  getPricesByLocation: (state, mandi) => 
    axios.get(`${API_BASE_URL}/mandi/location`, { params: { state, mandi } }),
  getAveragePrices: () => axios.get(`${API_BASE_URL}/mandi/average`),
  getPriceTrends: (commodity, days = 7) => 
    axios.get(`${API_BASE_URL}/mandi/trends`, { params: { commodity, days } }),
  getCommodities: () => axios.get(`${API_BASE_URL}/mandi/commodities`),
  getMandis: () => axios.get(`${API_BASE_URL}/mandi/mandis`)
};

export { apiClient };
export default apiClient;
