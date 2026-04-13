const { sanitizeInput, validateEmail } = require('../utils/passwordValidation');

/**
 * Middleware to sanitize all input to prevent XSS attacks
 */
const sanitizeInputMiddleware = (req, res, next) => {
  try {
    // Only sanitize body and query parameters (not files)
    if (req.body && typeof req.body === 'object') {
      Object.keys(req.body).forEach((key) => {
        if (typeof req.body[key] === 'string') {
          // Sanitize string inputs
          req.body[key] = sanitizeInput(req.body[key]);
        }
      });
    }

    if (req.query && typeof req.query === 'object') {
      Object.keys(req.query).forEach((key) => {
        if (typeof req.query[key] === 'string') {
          req.query[key] = sanitizeInput(req.query[key]);
        }
      });
    }

    next();
  } catch (error) {
    console.error('Sanitization error:', error);
    res.status(400).json({ error: 'Invalid input format' });
  }
};

/**
 * Middleware to validate critical input fields
 */
const validateInputMiddleware = (requiredFields = []) => {
  return (req, res, next) => {
    try {
      // Check required fields
      for (const field of requiredFields) {
        if (!req.body[field]) {
          return res.status(400).json({
            error: `Missing required field: ${field}`
          });
        }
      }

      // Special validation for email
      if (req.body.email && !validateEmail(req.body.email)) {
        return res.status(400).json({
          error: 'Invalid email format'
        });
      }

      // Length validation for strings
      Object.keys(req.body).forEach((key) => {
        if (typeof req.body[key] === 'string') {
          if (req.body[key].length > 1000) {
            return res.status(400).json({
              error: `Field '${key}' is too long (max 1000 characters)`
            });
          }
        }
      });

      next();
    } catch (error) {
      console.error('Input validation error:', error);
      res.status(400).json({ error: 'Input validation failed' });
    }
  };
};

/**
 * Middleware to prevent NoSQL injection and other attacks
 */
const preventInjectionMiddleware = (req, res, next) => {
  try {
    const checkForInjection = (obj, depth = 0) => {
      if (depth > 5) return; // Prevent deep nesting
      
      if (typeof obj === 'object' && obj !== null) {
        Object.keys(obj).forEach((key) => {
          // Check for typical injection patterns
          if (key.includes('$') || key.includes('.')) {
            throw new Error('Potentially dangerous key detected');
          }
          
          if (typeof obj[key] === 'object') {
            checkForInjection(obj[key], depth + 1);
          }
        });
      }
    };

    checkForInjection(req.body);
    checkForInjection(req.query);

    next();
  } catch (error) {
    console.error('Injection prevention triggered:', error.message);
    res.status(400).json({ error: 'Invalid input format' });
  }
};

/**
 * Middleware to set secure headers
 */
const secureHeadersMiddleware = (req, res, next) => {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Prevent MIME-type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Enable XSS filter
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Content Security Policy
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'");
  
  // Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  next();
};

module.exports = {
  sanitizeInputMiddleware,
  validateInputMiddleware,
  preventInjectionMiddleware,
  secureHeadersMiddleware
};
