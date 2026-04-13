import React, { useState, useEffect } from 'react';

/**
 * Password strength validator - mirrors backend validation
 */
const validatePasswordStrength = (password) => {
  const requirements = {
    minLength: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
  };

  const meetsRequirements = Object.values(requirements).filter(Boolean).length;
  let score = (meetsRequirements / 5) * 100;

  if (password.length < 8) score -= 20;
  if (password.length > 128) score = 0;

  return {
    requirements,
    score: Math.max(0, Math.min(100, score)),
    meetsRequirements,
    totalRequirements: 5
  };
};

/**
 * Get password strength label
 */
const getStrengthLabel = (score) => {
  if (score >= 80) return { label: 'Very Strong', color: '#28a745', emoji: '🟢' };
  if (score >= 60) return { label: 'Strong', color: '#17a2b8', emoji: '🔵' };
  if (score >= 40) return { label: 'Medium', color: '#ffc107', emoji: '🟡' };
  if (score >= 20) return { label: 'Weak', color: '#fd7e14', emoji: '🟠' };
  return { label: 'Very Weak', color: '#dc3545', emoji: '🔴' };
};

/**
 * Password Strength Indicator Component
 */
export const PasswordStrengthIndicator = ({ password }) => {
  const [strength, setStrength] = useState(null);

  useEffect(() => {
    if (password) {
      setStrength(validatePasswordStrength(password));
    } else {
      setStrength(null);
    }
  }, [password]);

  if (!strength) {
    return null;
  }

  const { score, requirements, meetsRequirements, totalRequirements } = strength;
  const { label, color, emoji } = getStrengthLabel(score);

  return (
    <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
      <div style={{ marginBottom: '0.5rem' }}>
        <strong>Password Strength: {emoji} {label}</strong>
        <div style={{
          width: '100%',
          height: '8px',
          backgroundColor: '#e9ecef',
          borderRadius: '4px',
          marginTop: '0.5rem',
          overflow: 'hidden'
        }}>
          <div
            style={{
              width: `${score}%`,
              height: '100%',
              backgroundColor: color,
              transition: 'width 0.3s ease'
            }}
          />
        </div>
      </div>

      <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.5rem' }}>
        <p style={{ margin: '0.25rem 0', fontWeight: 'bold' }}>
          Requirements: {meetsRequirements}/{totalRequirements} met
        </p>
        <ul style={{ margin: '0.5rem 0', paddingLeft: '1.2rem' }}>
          <li style={{ 
            color: requirements.minLength ? '#28a745' : '#dc3545',
            textDecoration: requirements.minLength ? 'line-through' : 'none'
          }}>
            {requirements.minLength ? '✅' : '❌'} At least 8 characters
          </li>
          <li style={{ 
            color: requirements.uppercase ? '#28a745' : '#dc3545',
            textDecoration: requirements.uppercase ? 'line-through' : 'none'
          }}>
            {requirements.uppercase ? '✅' : '❌'} One UPPERCASE letter
          </li>
          <li style={{ 
            color: requirements.lowercase ? '#28a745' : '#dc3545',
            textDecoration: requirements.lowercase ? 'line-through' : 'none'
          }}>
            {requirements.lowercase ? '✅' : '❌'} One lowercase letter
          </li>
          <li style={{ 
            color: requirements.number ? '#28a745' : '#dc3545',
            textDecoration: requirements.number ? 'line-through' : 'none'
          }}>
            {requirements.number ? '✅' : '❌'} One number (0-9)
          </li>
          <li style={{ 
            color: requirements.special ? '#28a745' : '#dc3545',
            textDecoration: requirements.special ? 'line-through' : 'none'
          }}>
            {requirements.special ? '✅' : '❌'} One special character (!@#$%^&*_+- etc)
          </li>
        </ul>
      </div>
    </div>
  );
};

/**
 * Alert Component
 */
export const Alert = ({ type = 'info', message, onClose }) => {
  const colors = {
    success: { bg: '#d4edda', border: '#c3e6cb', text: '#155724', emoji: '✅' },
    error: { bg: '#f8d7da', border: '#f5c6cb', text: '#721c24', emoji: '❌' },
    warning: { bg: '#fff3cd', border: '#ffeaa7', text: '#856404', emoji: '⚠️' },
    info: { bg: '#d1ecf1', border: '#bee5eb', text: '#0c5460', emoji: 'ℹ️' }
  };

  const style = colors[type] || colors.info;

  useEffect(() => {
    if (type === 'success' || type === 'info') {
      const timer = setTimeout(onClose, 5000);
      return () => clearTimeout(timer);
    }
  }, [type, onClose]);

  return (
    <div style={{
      backgroundColor: style.bg,
      border: `1px solid ${style.border}`,
      color: style.text,
      padding: '0.75rem 1rem',
      borderRadius: '4px',
      marginBottom: '1rem',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }}>
      <span>{style.emoji} {message}</span>
      {onClose && (
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: style.text,
            cursor: 'pointer',
            fontSize: '1.2rem',
            padding: '0'
          }}
        >
          ×
        </button>
      )}
    </div>
  );
};

export default PasswordStrengthIndicator;
