const express = require("express");
const router = express.Router();
const User = require("../models/User");
const generateToken = require("../utils/generateToken");
const { protect, admin } = require("../middleware/authMiddleware");
const Room = require("../models/Room");
const upload = require("../middleware/uploadMiddleware"); // Import the upload middleware

// POST /api/auth/signup
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
      profilePhoto: user.profilePhoto, // Ensure this is sent
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

// PUT /api/auth/change-password
router.put('/change-password', protect, async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id);

  if (user && (await user.matchPassword(oldPassword))) {
    user.password = newPassword;
    await user.save();
    res.json({ message: 'Password updated successfully' });
  } else {
    res.status(401).json({ message: 'Invalid old password' });
  }
});

// --- NEW: UPDATE PROFILE PHOTO ---
router.put('/update-profile', protect, upload.single('profilePhoto'), async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // 1. Check if a file was uploaded
    if (req.file) {
      // 2. Delete the old photo if it exists
      if (user.profilePhoto) {
        await upload.deleteFromCloudinary(user.profilePhoto);
      }
      // 3. Update with new photo URL
      user.profilePhoto = req.file.path;
      
      await user.save();

      // Return the updated user info
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        roomNo: user.roomNo,
        isAdmin: user.isAdmin,
        profilePhoto: user.profilePhoto,
        token: generateToken(user._id) 
      });
    } else {
      res.status(400).json({ message: "No image file provided" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Profile update failed" });
  }
});

module.exports = router;