const express = require('express');
const router = express.Router();
const Complaint = require('../models/Complaint');
const { protect, admin } = require('../middleware/authMiddleware');

// POST /api/complaints (Tenant: Lodge Complaint)
router.post('/', protect, async (req, res) => {
  const { title, description } = req.body;
  const complaint = await Complaint.create({
    user: req.user._id,
    title, description
  });
  res.status(201).json(complaint);
});

// GET /api/complaints (Split Logic)
router.get('/', protect, async (req, res) => {
  if (req.user.isAdmin) {
    const complaints = await Complaint.find({}).populate('user', 'name roomNo');
    res.json(complaints);
  } else {
    const complaints = await Complaint.find({ user: req.user._id });
    res.json(complaints);
  }
});

// PUT /api/complaints/:id (Admin: Resolve)
router.put('/:id', protect, admin, async (req, res) => {
  const complaint = await Complaint.findById(req.params.id);
  if (complaint) {
    complaint.status = req.body.status;
    const updatedComplaint = await complaint.save();
    res.json(updatedComplaint);
  } else {
    res.status(404).json({ message: 'Complaint not found' });
  }
});

module.exports = router;