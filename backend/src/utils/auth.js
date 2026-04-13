const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

/**
 * Hash password with bcrypt (10 rounds of salt)
 * @param {string} password - Plain password
 * @returns {Promise<string>} - Hashed password
 */
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

/**
 * Verify password against hash
 * @param {string} password - Plain password
 * @param {string} hash - Hashed password
 * @returns {Promise<boolean>} - Password match result
 */
const verifyPassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

/**
 * Generate JWT access token (short-lived, 1 hour)
 * @param {object} user - User object
 * @returns {string} - JWT token
 */
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      userType: user.user_type,
      fullName: user.full_name,
      type: 'access'
    },
    process.env.JWT_SECRET || 'your_jwt_secret',
    { 
      expiresIn: '1h', // Shorter expiration for access token
      algorithm: 'HS256'
    }
  );
};

/**
 * Generate JWT access token with FPO info
 * @param {object} user - User object
 * @param {string} fpo_id - FPO ID
 * @returns {string} - JWT token
 */
const generateTokenWithFPO = (user, fpo_id) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      userType: user.user_type,
      fullName: user.full_name,
      fpo_id: fpo_id,
      type: 'access'
    },
    process.env.JWT_SECRET || 'your_jwt_secret',
    { 
      expiresIn: '1h', // Shorter expiration for access token
      algorithm: 'HS256'
    }
  );
};

/**
 * Generate JWT refresh token (long-lived, 7 days)
 * @param {object} user - User object
 * @returns {string} - Refresh token
 */
const generateRefreshToken = (user) => {
  return jwt.sign(
    { 
      id: user.id,
      type: 'refresh'
    },
    process.env.REFRESH_SECRET || process.env.JWT_SECRET || 'your_refresh_secret',
    { 
      expiresIn: '7d',
      algorithm: 'HS256'
    }
  );
};

/**
 * Verify JWT token
 * @param {string} token - JWT token
 * @param {string} type - Token type ('access' or 'refresh')
 * @returns {object|null} - Decoded token or null
 */
const verifyToken = (token, type = 'access') => {
  try {
    const secret = type === 'refresh' 
      ? (process.env.REFRESH_SECRET || process.env.JWT_SECRET || 'your_refresh_secret')
      : (process.env.JWT_SECRET || 'your_jwt_secret');
    
    return jwt.verify(token, secret);
  } catch (error) {
    console.error(`Token verification failed (${type}):`, error.message);
    return null;
  }
};

/**
 * Set secure cookie options
 * @returns {object} - Cookie options
 */
const getCookieOptions = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  return {
    httpOnly: true, // Prevent JavaScript access (XSS protection)
    secure: isProduction, // Only HTTPS in production
    sameSite: 'strict', // CSRF protection
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    signed: true, // Sign the cookie
    path: '/'
  };
};

/**
 * Set secure refresh cookie options (longer expiration)
 * @returns {object} - Cookie options
 */
const getRefreshCookieOptions = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  return {
    httpOnly: true, // Prevent JavaScript access
    secure: isProduction, // Only HTTPS in production
    sameSite: 'strict', // CSRF protection
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    signed: true, // Sign the cookie
    path: '/'
  };
};

module.exports = {
  hashPassword,
  verifyPassword,
  generateToken,
  generateTokenWithFPO,
  generateRefreshToken,
  verifyToken,
  getCookieOptions,
  getRefreshCookieOptions
};
