const express = require('express');
const router = express.Router();
const Rent = require('../models/Rent');
const { protect, admin } = require('../middleware/authMiddleware');

// POST /api/rent (Tenant: Submit Proof)
router.post('/', protect, async (req, res) => {
  const { month, year, amount, proofUrl } = req.body;
  const rent = await Rent.create({
    user: req.user._id,
    month, year, amount, proofUrl
  });
  res.status(201).json(rent);
});

// GET /api/rent (Split Logic)
router.get('/', protect, async (req, res) => {
  if (req.user.isAdmin) {
    // Admin sees ALL rents with User details
    const rents = await Rent.find({}).populate('user', 'name roomNo');
    res.json(rents);
  } else {
    // Tenant sees only THEIR rents
    const rents = await Rent.find({ user: req.user._id });
    res.json(rents);
  }
});

// PUT /api/rent/:id (Admin: Approve/Reject)
router.put('/:id', protect, admin, async (req, res) => {
  const rent = await Rent.findById(req.params.id);
  if (rent) {
    rent.status = req.body.status || rent.status;
    const updatedRent = await rent.save();
    res.json(updatedRent);
  } else {
    res.status(404).json({ message: 'Rent record not found' });
  }
});

module.exports = router;