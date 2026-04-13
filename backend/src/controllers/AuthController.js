const User = require('../models/User');
const { hashPassword, verifyPassword, generateToken, generateTokenWithFPO } = require('../utils/auth');
const { validatePassword, validateEmail } = require('../utils/passwordValidation');
const pool = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class AuthController {
  async register(req, res, next) {
    try {
      console.log('📝 [REGISTER] Request received:', { email: req.body.email, userType: req.body.userType });
      
      const { email, password, confirmPassword, fullName, userType, phone, location } = req.body;

      // Only allow FPO and Buyer registration (farmers created by FPO)
      if (userType === 'farmer') {
        console.log('❌ [REGISTER] Farmer registration attempt denied');
        return res.status(400).json({ 
          error: 'Farmers are created by FPO. Use FPO account to create farmers.' 
        });
      }

      // Validate input
      if (!email || !password || !confirmPassword || !fullName || !userType) {
        console.log('❌ [REGISTER] Missing required fields:', { email, fullName, userType });
        return res.status(400).json({ 
          error: 'Missing required fields',
          required: ['email', 'password', 'confirmPassword', 'fullName', 'userType']
        });
      }

      // Check if passwords match
      if (password !== confirmPassword) {
        console.log('❌ [REGISTER] Passwords do not match');
        return res.status(400).json({ 
          error: 'Passwords do not match. Please ensure both password fields are identical.' 
        });
      }

      // Validate email format
      if (!validateEmail(email)) {
        console.log('❌ [REGISTER] Invalid email format:', email);
        return res.status(400).json({ 
          error: 'Invalid email format' 
        });
      }

      // Validate password strength
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.isValid) {
        console.log('❌ [REGISTER] Weak password:', passwordValidation.errors);
        return res.status(400).json({ 
          error: 'Password does not meet security requirements',
          requirements: passwordValidation.errors,
          score: passwordValidation.score
        });
      }

      console.log('🔍 [REGISTER] Checking if email already exists...');
      // Check if user exists
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        console.log('❌ [REGISTER] Email already registered:', email);
        return res.status(409).json({ 
          error: '❌ This email is already registered. Please use a different email or try logging in.',
          code: 'EMAIL_ALREADY_EXISTS'
        });
      }

      console.log('🔐 [REGISTER] Hashing password...');
      // Hash password and create user
      const passwordHash = await hashPassword(password);
      const userData = {
        email,
        passwordHash,
        fullName,
        userType,
        phone,
        location
      };

      console.log('💾 [REGISTER] Creating user in database...');
      const user = await User.create(userData);
      
      // If FPO, create FPO organization record
      let fpoId = null;
      if (userType === 'fpo') {
        console.log('🏢 [REGISTER] Creating FPO organization record...');
        fpoId = uuidv4();
        const fpoQuery = `
          INSERT INTO fpos (id, user_id, organization_name, license_number)
          VALUES ($1, $2, $3, $4)
          RETURNING id;
        `;
        
        try {
          const result = await pool.query(fpoQuery, [
            fpoId,
            user.id,
            fullName + ' FPO', // Default organization name
            `LICENSE_${Date.now()}` // Generate a temporary license number
          ]);
          console.log('✅ [REGISTER] FPO record created:', fpoId);
        } catch (fpoError) {
          console.error('❌ [REGISTER] Error creating FPO record:', fpoError.message);
          // Don't fail registration if FPO creation fails, just log it
          throw new Error('Failed to create FPO organization record: ' + fpoError.message);
        }
      }

      // If Buyer, create buyer profile and wallet
      if (userType === 'buyer') {
        console.log('👤 [REGISTER] Creating buyer profile...');
        const buyerId = uuidv4();
        const buyerQuery = `
          INSERT INTO buyers (id, user_id, company_name, industry_type)
          VALUES ($1, $2, $3, $4)
          RETURNING id;
        `;
        
        try {
          const buyerResult = await pool.query(buyerQuery, [
            buyerId,
            user.id,
            fullName || 'Buyer',
            'retailer'
          ]);
          console.log('✅ [REGISTER] Buyer record created:', buyerId);

          // Now create wallet for this buyer
          console.log('💳 [REGISTER] Creating buyer wallet...');
          const walletQuery = `
            INSERT INTO buyer_wallets (buyer_id, balance, total_spent)
            VALUES ($1, 100000, 0)
            RETURNING id;
          `;
          
          const walletResult = await pool.query(walletQuery, [buyerId]);
          console.log('✅ [REGISTER] Wallet created with 100,000 balance for buyer:', buyerId);
        } catch (buyerError) {
          console.error('❌ [REGISTER] Error creating buyer profile or wallet:', buyerError.message);
          throw new Error('Failed to create buyer profile: ' + buyerError.message);
        }
      }
      
      console.log('🔑 [REGISTER] Generating token...');
      const token = generateTokenWithFPO(user, fpoId);

      console.log('✅ [REGISTER] Registration successful:', { userId: user.id, email: user.email });
      res.status(201).json({
        success: true,
        message: '✅ Registration successful! You can now login.',
        user: {
          ...user,
          fpo_id: fpoId
        },
        token
      });
    } catch (error) {
      console.error('❌ [REGISTER] Error during registration:', error.message);
      next(error);
    }
  }

  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ 
          error: 'Email and password required' 
        });
      }

      // Find by email
      const query = 'SELECT * FROM users WHERE email = $1';
      const result = await require('../config/database').query(query, [email]);
      
      if (result.rows.length === 0) {
        // Don't reveal if email exists or not (security best practice)
        return res.status(401).json({ 
          error: '❌ Invalid email or password' 
        });
      }

      const user_data = result.rows[0];
      const passwordMatch = await verifyPassword(password, user_data.password_hash);

      if (!passwordMatch) {
        // Don't reveal if email exists or not (security best practice)
        return res.status(401).json({ 
          error: '❌ Invalid email or password' 
        });
      }

      // For FPO users, get the FPO ID
      let fpo_id = null;
      if (user_data.user_type === 'fpo') {
        const fpoQuery = 'SELECT id FROM fpos WHERE user_id = $1 LIMIT 1';
        const fpoResult = await require('../config/database').query(fpoQuery, [user_data.id]);
        if (fpoResult.rows.length > 0) {
          fpo_id = fpoResult.rows[0].id;
        }
      }

      const token = generateTokenWithFPO(user_data, fpo_id);

      console.log('✅ [LOGIN] User logged in successfully:', user_data.email);
      res.json({
        success: true,
        message: '✅ Login successful!',
        user: {
          id: user_data.id,
          email: user_data.email,
          fullName: user_data.full_name,
          userType: user_data.user_type,
          fpo_id: fpo_id
        },
        token
      });
    } catch (error) {
      console.error('❌ [LOGIN] Login error:', error.message);
      next(error);
    }
  }

  async getProfile(req, res, next) {
    try {
      const user = await User.findById(req.user.id);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({ success: true, user });
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req, res, next) {
    try {
      const { fullName, phone, location } = req.body;

      const updatedUser = await User.updateProfile(req.user.id, {
        fullName: fullName || req.user.fullName,
        phone,
        location
      });

      res.json({ success: true, user: updatedUser });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();
