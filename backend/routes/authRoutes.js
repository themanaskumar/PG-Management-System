const express = require("express");
const router = express.Router();
const User = require("../models/User");
const generateToken = require("../utils/generateToken");
const { protect, admin } = require("../middleware/authMiddleware");
const Room = require("../models/Room");

// POST /api/auth/signup
// (Kept as is, though usually tenants are created via Admin Dashboard now)
router.post("/signup", async (req, res) => {
  const {
    name, email, password, phone, roomNo, idType, idNumber, deposit, isAdmin,
  } = req.body;

  const userExists = await User.findOne({ email });
  if (userExists) return res.status(400).json({ message: "User already exists" });

  if (!isAdmin) {
    const room = await Room.findOne({ roomNo });
    if (!room) return res.status(400).json({ message: `Room ${roomNo} does not exist.` });
    if (room.status === "Occupied") return res.status(400).json({ message: `Room ${roomNo} is already occupied.` });
  }

  const user = await User.create({
    name, email, password, phone, roomNo, idType, idNumber, deposit, isAdmin,
  });

  if (!isAdmin && user) {
    await Room.findOneAndUpdate({ roomNo }, { status: "Occupied", currentTenant: user._id });
  }

  if (user) {
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      roomNo: user.roomNo,
      isAdmin: user.isAdmin,
      token: generateToken(user._id),
    });
  } else {
    res.status(400).json({ message: "Invalid user data" });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (user && (await user.matchPassword(password))) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      roomNo: user.roomNo,
      isAdmin: user.isAdmin,
      
      // --- THIS WAS MISSING ---
      profilePhoto: user.profilePhoto, 
      // ------------------------

      token: generateToken(user._id),
    });
  } else {
    res.status(401).json({ message: "Invalid email or password" });
  }
});

// GET /api/auth/users (Admin)
router.get("/users", protect, admin, async (req, res) => {
  const users = await User.find({ isAdmin: false });
  res.json(users);
});

module.exports = router;