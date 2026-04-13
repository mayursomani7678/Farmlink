import React, { useState } from 'react';
import { authService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { PasswordStrengthIndicator, Alert } from '../components/PasswordStrength';
import '../styles/Auth.css';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      console.log('[LOGIN] Sending login request for:', email);
      const response = await authService.login(email, password);
      console.log('[LOGIN] Login successful! Response:', response.data);
      
      setSuccess('Login successful! Redirecting...');
      login(response.data.user, response.data.token);

      setTimeout(() => {
        // Redirect based on user type
        if (response.data.user.userType === 'fpo') {
          navigate('/fpo/dashboard');
        } else if (response.data.user.userType === 'buyer') {
          navigate('/buyer/marketplace');
        } else {
          navigate('/');
        }
      }, 1500);
    } catch (err) {
      console.error('[LOGIN] Login failed:', {
        status: err.response?.status,
        error: err.response?.data?.error,
        message: err.message,
        code: err.code,
        url: err.config?.url
      });
      
      // Better error messages
      if (err.code === 'ECONNREFUSED') {
        setError('Cannot connect to server. Is backend running on port 5000?');
      } else if (err.code === 'ENOTFOUND') {
        setError('Network error: Cannot reach server');
      } else if (err.response?.status === 401) {
        setError('Invalid email or password');
      } else if (err.response?.status === 404) {
        setError('User not found');
      } else if (err.response?.status === 429) {
        setError('Too many login attempts. Please try again after 15 minutes.');
      } else if (err.message === 'timeout of 30000ms exceeded') {
        setError('Request timeout. Server is slow or unreachable');
      } else {
        setError(err.response?.data?.error || err.message || 'Login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Farmlink</h1>
        <h2>Login</h2>

        {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}
        {error && <Alert type="error" message={error} onClose={() => setError('')} />}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #ddd' }}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #ddd' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: '4px',
                  border: '1px solid #ddd',
                  backgroundColor: '#f0f0f0',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: '500'
                }}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.75rem',
              backgroundColor: loading ? '#ccc' : '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '1rem',
              fontWeight: 'bold'
            }}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p style={{ marginTop: '1rem', textAlign: 'center' }}>
          Don't have an account? <a href="/register" style={{ color: '#007bff', textDecoration: 'none' }}>Register here</a>
        </p>
      </div>
    </div>
  );
};

export const RegisterPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    userType: 'fpo',
    phone: '',
    location: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear validation error for this field when user starts typing
    if (validationErrors[name]) {
      setValidationErrors((prev) => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    console.log('[REGISTER] Form submitted with data:', formData);
    
    const newErrors = {};

    // Frontend validation
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match! Please ensure both passwords are identical.';
      newErrors.password = 'Passwords do not match!';
    }

    if (!formData.fullName) {
      newErrors.fullName = 'Full name is required';
    }

    // If there are validation errors, show them and don't submit
    if (Object.keys(newErrors).length > 0) {
      setValidationErrors(newErrors);
      setError('Please fix the errors below');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');
    setValidationErrors({});

    try {
      console.log('[REGISTER] Sending registration request...');
      const response = await authService.register(formData);
      console.log('[REGISTER] Registration successful! Response:', response.data);
      
      setSuccess('Registration successful! Logging you in...');
      
      console.log('[REGISTER] Logging in user...');
      login(response.data.user, response.data.token);
      console.log('[REGISTER] User logged in successfully');
      
      setTimeout(() => {
        console.log('[REGISTER] Redirecting to home...');
        navigate('/');
      }, 1500);
    } catch (err) {
      console.error('[REGISTER] Registration failed:', {
        status: err.response?.status,
        error: err.response?.data?.error,
        message: err.message,
        fullError: err
      });
      
      if (err.response?.status === 409 || err.response?.data?.code === 'EMAIL_ALREADY_EXISTS') {
        setError('This email is already registered. Please use a different email or try logging in.');
        setValidationErrors({ email: 'Email already in use' });
      } else if (err.response?.status === 400 && err.response?.data?.error?.includes('Passwords do not match')) {
        setError('Passwords do not match! Please ensure both password fields are identical.');
        setValidationErrors({ 
          password: 'Passwords do not match',
          confirmPassword: 'Passwords do not match'
        });
      } else if (err.response?.status === 429) {
        setError('Too many registration attempts from this IP. Please try again after 1 hour.');
      } else if (err.response?.data?.requirements) {
        // Password requirements error
        setError(`Password does not meet security requirements:\n${err.response.data.requirements.join('\n')}`);
      } else {
        setError(err.response?.data?.error || err.message || 'Registration failed. Please try again.');
      }
    } finally {
      console.log('[REGISTER] Resetting loading state');
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
        <h1>Farmlink</h1>
        <h2>Register</h2>

        {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}
        {error && <Alert type="error" message={error} onClose={() => setError('')} />}

        <form onSubmit={handleRegister}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              name="email"
              placeholder="your.email@example.com"
              value={formData.email}
              onChange={handleChange}
              required
              style={{ 
                width: '100%', 
                padding: '0.75rem', 
                borderRadius: '4px', 
                border: validationErrors.email ? '2px solid #dc3545' : '1px solid #ddd',
                backgroundColor: validationErrors.email ? '#fff5f5' : 'white'
              }}
            />
            {validationErrors.email && <span style={{ color: '#dc3545', fontSize: '0.85rem' }}>{validationErrors.email}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="Enter strong password (min 8 chars)"
                value={formData.password}
                onChange={handleChange}
                required
                style={{ 
                  width: '100%', 
                  padding: '0.75rem', 
                  borderRadius: '4px', 
                  border: validationErrors.password ? '2px solid #dc3545' : '1px solid #ddd',
                  backgroundColor: validationErrors.password ? '#fff5f5' : 'white'
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: '4px',
                  border: '1px solid #ddd',
                  backgroundColor: '#f0f0f0',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: '500'
                }}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            {validationErrors.password && <span style={{ color: '#dc3545', fontSize: '0.85rem' }}>{validationErrors.password}</span>}
            <PasswordStrengthIndicator password={formData.password} />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                placeholder="Re-enter your password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                style={{ 
                  width: '100%', 
                  padding: '0.75rem', 
                  borderRadius: '4px', 
                  border: validationErrors.confirmPassword ? '2px solid #dc3545' : '1px solid #ddd',
                  backgroundColor: validationErrors.confirmPassword ? '#fff5f5' : 'white'
                }}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: '4px',
                  border: '1px solid #ddd',
                  backgroundColor: '#f0f0f0',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: '500'
                }}
              >
                {showConfirmPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            {validationErrors.confirmPassword && <span style={{ color: '#dc3545', fontSize: '0.85rem' }}>{validationErrors.confirmPassword}</span>}
            {formData.password && formData.confirmPassword && formData.password === formData.confirmPassword && (
              <span style={{ color: '#28a745', fontSize: '0.85rem' }}>Passwords match</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="fullName">Full Name</label>
            <input
              id="fullName"
              type="text"
              name="fullName"
              placeholder="Your full name"
              value={formData.fullName}
              onChange={handleChange}
              required
              style={{ 
                width: '100%', 
                padding: '0.75rem', 
                borderRadius: '4px', 
                border: validationErrors.fullName ? '2px solid #dc3545' : '1px solid #ddd',
                backgroundColor: validationErrors.fullName ? '#fff5f5' : 'white'
              }}
            />
            {validationErrors.fullName && <span style={{ color: '#dc3545', fontSize: '0.85rem' }}>{validationErrors.fullName}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="userType">Account Type</label>
            <select 
              id="userType"
              name="userType" 
              value={formData.userType} 
              onChange={handleChange}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #ddd' }}
            >
              <option value="fpo">FPO Operator</option>
              <option value="buyer">Buyer</option>
            </select>
          </div>

          <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.5rem', backgroundColor: '#f8f9fa', padding: '0.75rem', borderRadius: '4px' }}>
            <strong>Note:</strong> Farmers are created by FPO operators. FPO operators will provide farmers with a Farmer ID to access their transaction history.
          </p>

          <div className="form-group">
            <label htmlFor="phone">Phone</label>
            <input
              id="phone"
              type="tel"
              name="phone"
              placeholder="Your phone number (optional)"
              value={formData.phone}
              onChange={handleChange}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #ddd' }}
            />
          </div>

          <div className="form-group">
            <label htmlFor="location">Location</label>
            <input
              id="location"
              type="text"
              name="location"
              placeholder="Your location (optional)"
              value={formData.location}
              onChange={handleChange}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #ddd' }}
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.75rem',
              backgroundColor: loading ? '#ccc' : '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '1rem',
              fontWeight: 'bold'
            }}
          >
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>

        <p style={{ marginTop: '1rem', textAlign: 'center' }}>
          Already have an account? <a href="/login" style={{ color: '#007bff', textDecoration: 'none' }}>Login here</a>
        </p>
      </div>
    </div>
  );
};
