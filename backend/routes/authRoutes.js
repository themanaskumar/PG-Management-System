const express = require('express');
const router = express.Router();
const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const { protect, admin } = require('../middleware/authMiddleware');
const Room = require('../models/Room');

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  const { name, email, password, phone, roomNo, idType, idNumber, deposit, isAdmin } = req.body;
  
  // 1. Check User Existence
  const userExists = await User.findOne({ email });
  if (userExists) return res.status(400).json({ message: 'User already exists' });

  // 2. Check Room Availability (Skip check if creating an Admin)
  if (!isAdmin) {
    const room = await Room.findOne({ roomNo });
    if (!room) {
      return res.status(400).json({ message: `Room ${roomNo} does not exist.` });
    }
    if (room.status === 'Occupied') {
      return res.status(400).json({ message: `Room ${roomNo} is already occupied.` });
    }
    
    // Mark Room as Occupied
    room.status = 'Occupied';
    await room.save();
  }

  // 3. Create User
  const user = await User.create({ 
    name, email, password, phone, roomNo, idType, idNumber, deposit, isAdmin 
  });

  if (user) {
    res.status(201).json({
      _id: user._id, name: user.name, email: user.email, isAdmin: user.isAdmin, token: generateToken(user._id)
    });
  } else {
    res.status(400).json({ message: 'Invalid user data' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (user && (await user.matchPassword(password))) {
    res.json({
      _id: user._id, name: user.name, email: user.email, isAdmin: user.isAdmin, token: generateToken(user._id)
    });
  } else {
    res.status(401).json({ message: 'Invalid email or password' });
  }
});

// GET /api/auth/users (Admin: Manage Tenants)
router.get('/users', protect, admin, async (req, res) => {
  const users = await User.find({ isAdmin: false });
  res.json(users);
});

module.exports = router;