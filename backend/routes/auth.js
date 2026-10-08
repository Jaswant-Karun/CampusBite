const express = require('express');
const router = express.Router();
const db = require('../data/db');
const { generateToken, verifyToken, authenticateToken, requireRole } = require('../middleware/auth');

// Default allowed passwords for seed demo accounts
const DEFAULT_PASSWORDS = {
  student: ['password123', 'student123'],
  admin: ['password123', 'admin123'],
  staff: ['password123', 'staff123'],
  faculty: ['password123', 'faculty123']
};

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password, role } = req.body;
  
  if (!email || !email.trim()) {
    return res.status(400).json({ success: false, message: 'Email, phone, or Student ID is required' });
  }

  // Find user by email, alternate_email, studentId, or phone
  const cleanInput = email.trim().toLowerCase();
  const digitsOnly = cleanInput.replace(/\D/g, '');

  let user = db.data.users.find(u => {
    if (u.email && u.email.toLowerCase() === cleanInput) return true;
    if (u.alternate_email && u.alternate_email.toLowerCase() === cleanInput) return true;
    if (u.studentId && u.studentId.toLowerCase() === cleanInput) return true;
    if (u.phone) {
      const uDigits = u.phone.replace(/\D/g, '');
      if (digitsOnly && (uDigits.endsWith(digitsOnly) || digitsOnly.endsWith(uDigits))) return true;
    }
    return false;
  });

  // If user not found, return 401 Invalid Credentials
  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials: user not found. Please check your credentials or register.'
    });
  }

  // Verify password if provided
  if (password) {
    const userRole = (user.role || 'student').toLowerCase();
    const validList = DEFAULT_PASSWORDS[userRole] || ['password123'];
    const userPass = user.password || validList[0];

    const isMatch = (password === userPass) || validList.includes(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid password. Please check your password and try again.'
      });
    }
  }

  // Generate cryptographic signed token
  const token = generateToken(user);

  return res.json({
    success: true,
    message: `Welcome back, ${user.name}!`,
    token: token,
    user: user
  });
});

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { name, email, phone, role, studentId, department, password } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, message: 'Name is required' });
  }
  if (!email || !email.trim()) {
    return res.status(400).json({ success: false, message: 'Email is required' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const existing = db.data.users.find(u => u.email.toLowerCase() === cleanEmail);
  if (existing) {
    return res.status(400).json({ success: false, message: 'Email is already registered. Please sign in.' });
  }

  const assignedRole = (role && role.toLowerCase() === 'admin') ? 'admin' : (role || 'student').toLowerCase();

  const newUser = {
    id: 'u-' + Date.now(),
    name: name.trim(),
    email: cleanEmail,
    phone: phone ? phone.trim() : '+91 90000 00000',
    role: assignedRole,
    studentId: studentId ? studentId.trim() : 'CB-2024-' + Math.floor(1000 + Math.random() * 9000),
    department: department ? department.trim() : 'Computer Science & Business Systems',
    loyalty_points: 50, // Welcome bonus points!
    wallet_balance: 500,
    password: password || 'password123',
    avatar: assignedRole === 'admin' ? 'AD' : name.substring(0, 2).toUpperCase()
  };

  db.data.users.push(newUser);
  db.saveData();

  // Sync to MongoDB if available
  try {
    const { User: MongoUser } = require('../data/mongo');
    if (MongoUser) {
      await MongoUser.create(newUser);
    }
  } catch (err) {}

  const token = generateToken(newUser);

  return res.status(201).json({
    success: true,
    message: 'Account created successfully! +50 Welcome Loyalty Points credited.',
    user: newUser,
    token: token
  });
});

// GET /api/auth/profile/:id
router.get('/profile/:id', (req, res) => {
  const user = db.data.users.find(u => u.id === req.params.id);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }
  res.json({ success: true, user });
});

// GET /api/auth/me (Protected route)
router.get('/me', authenticateToken, (req, res) => {
  const user = db.data.users.find(u => u.id === req.user.id);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User profile not found' });
  }
  res.json({ success: true, user });
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

// GET /api/auth/admin-check (Protected Admin-Only route for role verification)
router.get('/admin-check', authenticateToken, requireRole('admin'), (req, res) => {
  res.json({
    success: true,
    message: 'Admin authorization verified',
    user: req.user
  });
});

module.exports = router;
