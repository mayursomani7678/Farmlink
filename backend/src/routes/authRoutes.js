const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/AuthController');
const { authMiddleware } = require('../middleware/auth');
const { loginLimiter, registerLimiter } = require('../middleware/rateLimiting');
const { sanitizeInputMiddleware, validateInputMiddleware } = require('../middleware/inputValidation');

// Public routes with rate limiting and input validation
router.post('/register', 
  registerLimiter, // Rate limit registrations
  sanitizeInputMiddleware, // Sanitize inputs
  validateInputMiddleware(['email', 'password', 'fullName', 'userType']), // Validate inputs
  (req, res, next) => AuthController.register(req, res, next)
);

router.post('/login', 
  loginLimiter, // Rate limit login attempts
  sanitizeInputMiddleware, // Sanitize inputs
  validateInputMiddleware(['email', 'password']), // Validate inputs
  (req, res, next) => AuthController.login(req, res, next)
);

// Protected routes
router.get('/profile', 
  authMiddleware, 
  (req, res, next) => AuthController.getProfile(req, res, next)
);

router.put('/profile', 
  authMiddleware, 
  sanitizeInputMiddleware, // Sanitize inputs
  (req, res, next) => AuthController.updateProfile(req, res, next)
);

module.exports = router;
