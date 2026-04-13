const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const fpoRoutes = require('./routes/fpoRoutes');
const buyerRoutes = require('./routes/buyerRoutes');
const transparencyRoutes = require('./routes/transparencyRoutes');
const iotRoutes = require('./routes/iotRoutes');
const mandiRoutes = require('./routes/mandiRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const errorHandler = require('./middleware/errorHandler');
const { 
  secureHeadersMiddleware, 
  sanitizeInputMiddleware, 
  preventInjectionMiddleware 
} = require('./middleware/inputValidation');

const app = express();

// ============ SECURITY MIDDLEWARE ============

// Helmet: Set security HTTP headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:']
    }
  },
  frameguard: { action: 'deny' },
  xssFilter: true,
  noSniff: true,
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  }
}));

// Custom secure headers
app.use(secureHeadersMiddleware);

// CORS Configuration - Allow specific origins in production
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Body parser with size limit
app.use(express.json({ 
  limit: '10mb',
  strict: true // Only parse valid JSON
}));

app.use(express.urlencoded({ 
  limit: '10mb', 
  extended: true 
}));

// ============ INPUT PROTECTION ============

// Sanitize all inputs to prevent XSS
app.use(sanitizeInputMiddleware);

// Prevent injection attacks
app.use(preventInjectionMiddleware);

// ============ SECURITY LOGGING ============
app.use((req, res, next) => {
  // Log security-relevant requests
  if (req.path.includes('/auth')) {
    console.log(`🔐 [${req.method}] ${req.path} - IP: ${req.ip}`);
  }
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'Farmlink Backend is running',
    timestamp: new Date().toISOString()
  });
});

// ============ ROUTES ============

app.use('/api/auth', authRoutes);
app.use('/api/fpo', fpoRoutes);
app.use('/api/buyer', buyerRoutes);
app.use('/api/transparency', transparencyRoutes);
app.use('/api/iot', iotRoutes);
app.use('/api/mandi', mandiRoutes);
app.use('/api/payment', paymentRoutes);

// ============ ERROR HANDLING ============

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: '❌ Route not found',
    path: req.path,
    method: req.method
  });
});

// Error handler
app.use(errorHandler);

// ============ SERVER START ============

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🌱 Farmlink Backend running on port ${PORT}`);
  console.log(`🔒 Security: Helmet + Rate Limiting + Input Sanitization enabled`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
