const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');

/**
 * RATE LIMITING SWITCH
 * Set ENABLE_RATE_LIMITING=false in environment to disable all rate limiting
 * Default: true (rate limiting enabled for production safety)
 */
const RATE_LIMITING_ENABLED = process.env.ENABLE_RATE_LIMITING !== 'false';

console.log(`🔒 Rate Limiting Status: ${RATE_LIMITING_ENABLED ? 'ENABLED' : 'DISABLED (Testing Mode)'}`);

/**
 * Rate limiter for login attempts
 * Limit: 5 attempts per 15 minutes
 */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  message: '❌ Too many login attempts. Please try again after 15 minutes.',
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many login attempts. Please try again after 15 minutes.',
      retryAfter: req.rateLimit.resetTime
    });
  },
  skip: (req) => {
    // Skip if rate limiting is disabled globally
    if (!RATE_LIMITING_ENABLED) return true;
    // Skip rate limiting for test environments if needed
    return process.env.NODE_ENV === 'test';
  }
});

/**
 * Rate limiter for registration attempts
 * Limit: 3 registrations per hour per IP
 */
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 attempts
  message: '❌ Too many registration attempts from this IP. Please try again after 1 hour.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many registration attempts from this IP. Please try again after 1 hour.',
      retryAfter: req.rateLimit.resetTime
    });
  },
  skip: (req) => {
    // Skip if rate limiting is disabled globally
    if (!RATE_LIMITING_ENABLED) return true;
    // Skip rate limiting for test environments
    return process.env.NODE_ENV === 'test';
  }
});

/**
 * Speed limiter for password reset
 * Gradually slow down requests
 */
const passwordResetSpeedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 2, // After 2 requests
  delayMs: (hits) => hits * 100 // Add 100ms for each request after the 2nd
});

/**
 * Rate limiter for general API endpoints
 * Limit: 30 requests per minute
 */
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requests
  message: '❌ Too many requests from this IP. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip if rate limiting is disabled globally
    return !RATE_LIMITING_ENABLED;
  }
});

/**
 * Strict rate limiter for payment/sensitive operations
 * Limit: 10 requests per hour per user
 */
const sensitiveOperationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 attempts
  message: '❌ Too many requests for this sensitive operation. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip if rate limiting is disabled globally
    if (!RATE_LIMITING_ENABLED) return true;
    // Only apply to authenticated users with specific operations
    return !req.user;
  }
});

module.exports = {
  loginLimiter,
  registerLimiter,
  passwordResetSpeedLimiter,
  apiLimiter,
  sensitiveOperationLimiter
};
