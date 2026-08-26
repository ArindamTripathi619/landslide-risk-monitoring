const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { auth, requireRole, generateToken } = require('../middleware/auth');

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, phone, district, state, village, language } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    // Only admins can create admin/district_admin accounts
    const restrictedRoles = ['admin', 'district_admin'];
    if (restrictedRoles.includes(role)) {
      // Allow initial admin creation if no admins exist
      const adminExists = await User.findOne({ role: 'admin' });
      if (adminExists) {
        return res.status(403).json({ success: false, message: 'Cannot self-register as admin' });
      }
    }

    const user = await User.create({
      name, email, password,
      role: role || 'villager',
      phone, district, state, village, language,
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id, name: user.name, email: user.email,
        role: user.role, district: user.district, state: user.state,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password required' });
    }

    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      token,
      user: {
        id: user._id, name: user.name, email: user.email,
        role: user.role, district: user.district, state: user.state,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get current user profile
router.get('/me', auth, async (req, res) => {
  res.json({ success: true, user: req.user });
});

// Update profile
router.put('/me', auth, async (req, res) => {
  try {
    const updates = {};
    const allowed = ['name', 'phone', 'district', 'state', 'village', 'language', 'location'];
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true }).select('-password');
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// List users (admin only)
router.get('/users', auth, requireRole('admin', 'district_admin'), async (req, res) => {
  try {
    const { role, district, page = 1, limit = 50 } = req.query;
    const query = {};
    if (role) query.role = role;
    if (district) query.district = district;

    const users = await User.find(query)
      .select('-password')
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(query);

    res.json({ success: true, users, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
