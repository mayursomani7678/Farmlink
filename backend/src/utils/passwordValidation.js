const validator = require('validator');

/**
 * Strong password policy enforcer
 * Minimum 8-12 characters with uppercase, lowercase, number, and special character
 */
const PASSWORD_REQUIREMENTS = {
  minLength: 8,
  maxLength: 128,
  uppercase: /[A-Z]/,
  lowercase: /[a-z]/,
  number: /[0-9]/,
  specialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/
};

// Common passwords to block
const COMMON_PASSWORDS = [
  'password', '123456', 'password123', '12345678', 'qwerty', 'abc123', 
  'monkey', 'letmein', 'trustno1', 'dragon', '12345', 'admin', 'admin123',
  'welcome', 'login', 'pass', 'pass123', 'hello', 'hello123', 'welcome123',
  'username', '111111', '123123', 'password1', 'iloveyou', 'sunshine',
  'princess', 'fuckyou', 'batman', 'superman', 'passw0rd'
];

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {object} - { isValid: boolean, errors: string[], score: number }
 */
const validatePassword = (password) => {
  const errors = [];
  let score = 0;

  if (!password) {
    return {
      isValid: false,
      errors: ['Password is required'],
      score: 0
    };
  }

  // Check length
  if (password.length < PASSWORD_REQUIREMENTS.minLength) {
    errors.push(`Password must be at least ${PASSWORD_REQUIREMENTS.minLength} characters long`);
  } else {
    score += 20;
  }

  if (password.length > PASSWORD_REQUIREMENTS.maxLength) {
    errors.push(`Password must not exceed ${PASSWORD_REQUIREMENTS.maxLength} characters`);
  }

  // Check common passwords
  if (COMMON_PASSWORDS.includes(password.toLowerCase())) {
    errors.push('Password is too common. Please choose a stronger password');
  } else {
    score += 20;
  }

  // Check uppercase
  if (!PASSWORD_REQUIREMENTS.uppercase.test(password)) {
    errors.push('Password must contain at least one UPPERCASE letter');
  } else {
    score += 15;
  }

  // Check lowercase
  if (!PASSWORD_REQUIREMENTS.lowercase.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  } else {
    score += 15;
  }

  // Check number
  if (!PASSWORD_REQUIREMENTS.number.test(password)) {
    errors.push('Password must contain at least one number (0-9)');
  } else {
    score += 15;
  }

  // Check special character
  if (!PASSWORD_REQUIREMENTS.specialChar.test(password)) {
    errors.push('Password must contain at least one special character (!@#$%^&*_+-etc)');
  } else {
    score += 15;
  }

  return {
    isValid: errors.length === 0,
    errors,
    score: Math.min(100, score)
  };
};

/**
 * Get password strength level
 * @param {number} score - Password score (0-100)
 * @returns {string} - Strength level
 */
const getPasswordStrength = (score) => {
  if (score >= 80) return 'Very Strong';
  if (score >= 60) return 'Strong';
  if (score >= 40) return 'Medium';
  if (score >= 20) return 'Weak';
  return 'Very Weak';
};

/**
 * Get password strength color
 * @param {number} score - Password score (0-100)
 * @returns {string} - Color code
 */
const getPasswordColor = (score) => {
  if (score >= 80) return '#28a745'; // Green
  if (score >= 60) return '#17a2b8'; // Blue
  if (score >= 40) return '#ffc107'; // Yellow
  if (score >= 20) return '#fd7e14'; // Orange
  return '#dc3545'; // Red
};

/**
 * Sanitize user input to prevent XSS
 * @param {string} input - Input to sanitize
 * @returns {string} - Sanitized input
 */
const sanitizeInput = (input) => {
  if (!input) return '';
  // Remove HTML tags and encode special characters
  return validator.escape(String(input).trim());
};

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} - Is valid email
 */
const validateEmail = (email) => {
  return validator.isEmail(String(email).toLowerCase().trim());
};

/**
 * Validate phone number
 * @param {string} phone - Phone to validate
 * @returns {boolean} - Is valid phone
 */
const validatePhone = (phone) => {
  if (!phone) return false;
  // Basic phone validation: at least 10 digits
  const phoneDigits = phone.replace(/\D/g, '');
  return phoneDigits.length >= 10 && phoneDigits.length <= 15;
};

module.exports = {
  validatePassword,
  getPasswordStrength,
  getPasswordColor,
  sanitizeInput,
  validateEmail,
  validatePhone,
  PASSWORD_REQUIREMENTS
};
