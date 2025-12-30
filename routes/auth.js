const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { authenticateToken, JWT_SECRET } = require('../middleware/auth');

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { username, password, mobile } = req.body;

    if (!username || !password || !mobile) {
      return res.status(400).json({ error: 'Username, password, and mobile number are required' });
    }

    if (username.length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Validate mobile number (basic validation - 10 digits)
    const mobileRegex = /^[0-9]{10}$/;
    if (!mobileRegex.test(mobile)) {
      return res.status(400).json({ error: 'Please enter a valid 10-digit mobile number' });
    }

    // Check if username exists
    const existingUsername = await User.findOne({ username: username.toLowerCase() });
    if (existingUsername) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    // Check if mobile exists
    const existingMobile = await User.findOne({ mobile });
    if (existingMobile) {
      return res.status(400).json({ error: 'Mobile number already registered' });
    }

    // Create new user
    const user = new User({
      username: username.toLowerCase(),
      password,
      mobile,
      isVerified: false
    });

    // Generate OTP
    const otp = user.generateOTP();
    await user.save();

    // In production, send SMS here
    // For demo, we'll log the OTP (replace with actual SMS service)
    console.log(`📱 OTP for ${mobile}: ${otp}`);

    res.status(201).json({
      message: 'Registration successful! Please verify your mobile number.',
      userId: user._id,
      // Remove this in production - only for testing
      debugOtp: process.env.NODE_ENV !== 'production' ? otp : undefined
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

// Send OTP (for resend or verification)
router.post('/send-otp', async (req, res) => {
  try {
    const { mobile } = req.body;

    if (!mobile) {
      return res.status(400).json({ error: 'Mobile number is required' });
    }

    const user = await User.findOne({ mobile });
    if (!user) {
      return res.status(404).json({ error: 'User not found with this mobile number' });
    }

    if (user.isVerified) {
      return res.status(400).json({ error: 'Mobile number already verified' });
    }

    // Generate new OTP
    const otp = user.generateOTP();
    await user.save();

    // In production, send SMS here
    console.log(`📱 OTP for ${mobile}: ${otp}`);

    res.json({
      message: 'OTP sent successfully!',
      // Remove this in production - only for testing
      debugOtp: process.env.NODE_ENV !== 'production' ? otp : undefined
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ error: 'Server error sending OTP' });
  }
});

// Verify OTP
router.post('/verify-otp', async (req, res) => {
  try {
    const { mobile, otp } = req.body;

    if (!mobile || !otp) {
      return res.status(400).json({ error: 'Mobile number and OTP are required' });
    }

    const user = await User.findOne({ mobile });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ error: 'Mobile number already verified' });
    }

    // Verify OTP
    if (!user.verifyOTP(otp)) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    // Mark user as verified
    user.isVerified = true;
    user.otp = null;
    user.otpExpiry = null;
    await user.save();

    // Generate JWT token for auto-login
    const token = jwt.sign(
      { userId: user._id, username: user.username, isVerified: user.isVerified },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Mobile number verified successfully!',
      token,
      user: {
        id: user._id,
        username: user.username,
        mobile: user.mobile,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ error: 'Server error verifying OTP' });
  }
});

// Login route
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Find user
    const user = await User.findOne({ username: username.toLowerCase() });
    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Check if user is verified
    if (!user.isVerified) {
      return res.status(403).json({ 
        error: 'Please verify your mobile number first',
        needsVerification: true,
        mobile: user.mobile
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, username: user.username, isVerified: user.isVerified },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        mobile: user.mobile,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// Verify token route
router.get('/verify', authenticateToken, (req, res) => {
  res.json({
    valid: true,
    user: {
      id: req.user._id,
      username: req.user.username,
      mobile: req.user.mobile,
      isVerified: req.user.isVerified
    }
  });
});

// Get current user
router.get('/me', authenticateToken, (req, res) => {
  res.json({
    user: {
      id: req.user._id,
      username: req.user.username,
      mobile: req.user.mobile,
      isVerified: req.user.isVerified
    }
  });
});

module.exports = router;
