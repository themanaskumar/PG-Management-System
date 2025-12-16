const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Room = require('../models/Room');
const { protect, admin } = require('../middleware/authMiddleware');
const generateToken = require('../utils/generateToken'); // Reuse token gen if you want auto-login, or just ignore

// GET /api/admin/tenants - View All Tenants
router.get('/tenants', protect, admin, async (req, res) => {
  const tenants = await User.find({ isAdmin: false }).select('-password');
  res.json(tenants);
});

// DELETE /api/admin/tenants/:id - Remove Tenant & Free Room
router.delete('/tenants/:id', protect, admin, async (req, res) => {
  const user = await User.findById(req.params.id);
  if (user) {
    // Free up the room
    const room = await Room.findOne({ roomNo: user.roomNo });
    if (room) {
      room.status = 'Vacant';
      await room.save();
    }
    await User.findByIdAndDelete(req.params.id); // Delete user
    res.json({ message: 'Tenant removed and room freed' });
  } else {
    res.status(404).json({ message: 'User not found' });
  }
});

// POST /api/admin/seed-rooms - One time setup
router.post('/seed-rooms', async (req, res) => {
  const rooms = [];
  // 3 Floors, 5 Rooms each
  for (let f = 1; f <= 3; f++) {
    for (let r = 1; r <= 5; r++) {
      rooms.push({ roomNo: `${f}0${r}`, floor: f, status: 'Vacant' });
    }
  }
  await Room.deleteMany({}); // Clear old
  await Room.insertMany(rooms);
  res.json({ message: '15 Rooms Created Successfully' });
});

// GET /api/admin/rooms - View Room Status
router.get('/rooms', protect, admin, async (req, res) => {
  const rooms = await Room.find({}).sort({ roomNo: 1 });
  res.json(rooms);
});

module.exports = router;