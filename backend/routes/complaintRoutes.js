const express = require('express');
const router = express.Router();
const Complaint = require('../models/Complaint');
const { protect, admin } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware'); // Import Cloudinary Middleware

// GET /api/complaints
router.get('/', protect, async (req, res) => {
  try {
    let complaints;
    if (req.user.isAdmin) {
      // Admin sees ALL complaints + User details
      complaints = await Complaint.find({})
        .populate('user', 'name roomNo phone') // Get tenant details
        .sort({ createdAt: -1 });
    } else {
      // Tenant sees ONLY their own
      complaints = await Complaint.find({ user: req.user._id }).sort({ createdAt: -1 });
    }
    res.json(complaints);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching complaints' });
  }
});

// POST /api/complaints (Lodge Complaint with Optional Image)
router.post('/', protect, upload.single('image'), async (req, res) => {
  try {
    const { roomNo, description } = req.body;
    
    // Check if file exists (since it's optional)
    const imageUrl = req.file ? req.file.path : null;

    const complaint = await Complaint.create({
      user: req.user._id,
      roomNo,
      description,
      imageUrl
    });

    res.status(201).json(complaint);
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: 'Failed to lodge complaint' });
  }
});

// PUT /api/complaints/:id (Resolve Complaint - Admin Only)
router.put('/:id', protect, admin, async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (complaint) {
      complaint.status = req.body.status || 'Resolved';
      await complaint.save();
      res.json(complaint);
    } else {
      res.status(404).json({ message: 'Complaint not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Update failed' });
  }
});

module.exports = router;