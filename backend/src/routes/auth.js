import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { authenticate } from '../middleware/auth.js';
import { requireSuperAdmin } from '../middleware/rbac.js';

const router = express.Router();

// Login (anyone can login if account exists and active)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: 'Account is inactive' });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        permissions: user.permissions,
        isSuperAdmin: user.isSuperAdmin,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Super admin only: Create new user
router.post('/users', authenticate, requireSuperAdmin, async (req, res) => {
  try {
    const { email, password, firstName, lastName, role, permissions } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ error: 'User already exists' });
    }

    const user = new User({
      email,
      password,
      firstName,
      lastName,
      role: role || 'staff',
      permissions: permissions || [],
      isActive: true,
      createdBy: req.user._id,
    });

    await user.save();

    res.status(201).json({
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      permissions: user.permissions,
      isActive: user.isActive,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Super admin only: List all users
router.get('/users', authenticate, requireSuperAdmin, async (req, res) => {
  try {
    const users = await User.find().select('-password').populate('createdBy', 'email firstName lastName');
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Super admin only: Get single user
router.get('/users/:id', authenticate, requireSuperAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password').populate('createdBy', 'email firstName lastName');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Super admin only: Update user (role, permissions, status)
router.put('/users/:id', authenticate, requireSuperAdmin, async (req, res) => {
  try {
    const { firstName, lastName, role, permissions, isActive } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      {
        firstName,
        lastName,
        role,
        permissions,
        isActive,
      },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Super admin only: Delete user
router.delete('/users/:id', authenticate, requireSuperAdmin, async (req, res) => {
  try {
    // Prevent deleting the last super admin
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.isSuperAdmin) {
      const otherSuperAdmins = await User.countDocuments({
        _id: { $ne: req.params.id },
        isSuperAdmin: true,
      });
      if (otherSuperAdmins === 0) {
        return res.status(403).json({ error: 'Cannot delete the last super admin' });
      }
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get current user
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json({
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      permissions: user.permissions,
      isSuperAdmin: user.isSuperAdmin,
      accessiblePages: user.getAccessiblePages(),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
