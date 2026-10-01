const express = require('express');
const router = express.Router();
const db = require('../data/db');

// Login endpoint
router.post('/login', (req, res) => {
  const { email, password, role } = req.body;
  
  if (!email) {
    return res.status(400).json({ success: false, message: 'Email or phone is required' });
  }

  // Find user by email, studentId, or phone
  const cleanInput = (email || '').trim().toLowerCase();
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

  // If user not found, create a demo session for the selected role
  if (!user) {
    user = {
      id: 'u-' + Date.now(),
      name: email.split('@')[0] || 'Campus User',
      email: email,
      phone: "+91 98765 00000",
      role: role || 'student',
      loyalty_points: 100,
      avatar: role === 'admin' ? 'RC' : 'JK'
    };
    db.data.users.push(user);
    db.saveData();
  }

  // Simulated JWT Token
  const token = `cb_token_${user.id}_${Date.now()}`;

  return res.json({
    success: true,
    message: 'Login successful',
    token: token,
    user: user
  });
});

// Register endpoint
router.post('/register', (req, res) => {
  const { name, email, phone, role, studentId, department } = req.body;

  if (!name || !email) {
    return res.status(400).json({ success: false, message: 'Name and email are required' });
  }

  const existing = db.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(400).json({ success: false, message: 'Email already registered' });
  }

  const newUser = {
    id: 'u-' + Date.now(),
    name,
    email,
    phone: phone || '+91 90000 00000',
    role: role || 'student',
    studentId: studentId || 'CB-2024-' + Math.floor(1000 + Math.random() * 9000),
    department: department || 'General Studies',
    loyalty_points: 50, // Welcome bonus points!
    avatar: role === 'admin' ? 'RC' : 'JK'
  };

  db.data.users.push(newUser);
  db.saveData();

  return res.status(201).json({
    success: true,
    message: 'Account created successfully! +50 Welcome Loyalty Points added.',
    user: newUser,
    token: `cb_token_${newUser.id}_${Date.now()}`
  });
});

// Profile endpoint
router.get('/profile/:id', (req, res) => {
  const user = db.data.users.find(u => u.id === req.params.id);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }
  res.json({ success: true, user });
});

module.exports = router;
