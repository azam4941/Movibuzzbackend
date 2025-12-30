const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { authenticateToken, requireAdmin, JWT_SECRET } = require('../middleware/auth');

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

    // Check if user is admin
    if (!user.isAdmin) {
      return res.status(403).json({ error: 'Access denied. You are not an admin.' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, username: user.username, isAdmin: user.isAdmin },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        isAdmin: user.isAdmin
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
      isAdmin: req.user.isAdmin
    }
  });
});

// Create admin (protected - only existing admins can create new admins)
router.post('/create-admin', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ username: username.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    // Create new admin user
    const newAdmin = new User({
      username: username.toLowerCase(),
      password,
      isAdmin: true
    });

    await newAdmin.save();

    res.status(201).json({
      message: 'Admin user created successfully',
      user: {
        id: newAdmin._id,
        username: newAdmin.username,
        isAdmin: newAdmin.isAdmin
      }
    });
  } catch (error) {
    console.error('Create admin error:', error);
    res.status(500).json({ error: 'Server error creating admin' });
  }
});

// Setup route - Create first admin (only works if no admins exist)
router.post('/setup', async (req, res) => {
  try {
    // Check if any admin exists
    const adminExists = await User.findOne({ isAdmin: true });
    if (adminExists) {
      return res.status(403).json({ error: 'Setup already completed. Admin exists.' });
    }

    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Create first admin
    const admin = new User({
      username: username.toLowerCase(),
      password,
      isAdmin: true
    });

    await admin.save();

    // Generate token for auto-login
    const token = jwt.sign(
      { userId: admin._id, username: admin.username, isAdmin: admin.isAdmin },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'First admin created successfully!',
      token,
      user: {
        id: admin._id,
        username: admin.username,
        isAdmin: admin.isAdmin
      }
    });
  } catch (error) {
    console.error('Setup error:', error);
    res.status(500).json({ error: 'Server error during setup' });
  }
});

// Check if setup is needed
router.get('/setup-status', async (req, res) => {
  try {
    const adminExists = await User.findOne({ isAdmin: true });
    res.json({ setupRequired: !adminExists });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

