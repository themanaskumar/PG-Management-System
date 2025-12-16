const express = require('express');
const router = express.Router();
const Rent = require('../models/Rent');
const User = require('../models/User'); // Required for the tracking logic
const { protect, admin } = require('../middleware/authMiddleware');

// --- NEW: Admin Track Rent (The "Left Join" Logic) ---
// GET /api/rent/track?month=December&year=2024
router.get('/track', protect, admin, async (req, res) => {
  try {
    const { month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({ message: "Month and Year are required" });
    }

    // 1. Fetch all Tenants (Users who are not admins)
    // Adjust the filter { isAdmin: false } based on your User model logic
    const tenants = await User.find({ isAdmin: false }).select('name roomNo email phone');

    // 2. Fetch Rent records for the specific month/year
    const rentRecords = await Rent.find({ month, year: parseInt(year) });

    // 3. Merge Data: Loop through tenants and find their rent status
    const report = tenants.map(tenant => {
      const record = rentRecords.find(r => r.user.toString() === tenant._id.toString());

      return {
        tenantId: tenant._id,
        name: tenant.name,
        roomNo: tenant.roomNo,
        phone: tenant.phone,
        // If record exists, use its status/data. If not, mark as 'Not Paid'
        status: record ? record.status : 'Not Paid', 
        amount: record ? record.amount : 0,
        rentId: record ? record._id : null,
        proofUrl: record ? record.proofUrl : null,
        updatedAt: record ? record.updatedAt : null
      };
    });

    res.json(report);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching rent report' });
  }
});

// --- Standard CRUD Routes ---

// POST /api/rent (Tenant: Submit Proof)
router.post('/', protect, async (req, res) => {
  const { month, year, amount, proofUrl } = req.body;
  try {
    const rent = await Rent.create({
      user: req.user._id,
      month, 
      year, 
      amount, 
      proofUrl
    });
    res.status(201).json(rent);
  } catch (error) {
    res.status(400).json({ message: 'Failed to submit rent' });
  }
});

// GET /api/rent (History for individual tenant)
router.get('/', protect, async (req, res) => {
  try {
    // Tenants only see their own history
    const rents = await Rent.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(rents);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching rents' });
  }
});

// PUT /api/rent/:id (Admin: Approve/Reject)
router.put('/:id', protect, admin, async (req, res) => {
  try {
    const rent = await Rent.findById(req.params.id);
    if (rent) {
      rent.status = req.body.status || rent.status;
      const updatedRent = await rent.save();
      res.json(updatedRent);
    } else {
      res.status(404).json({ message: 'Rent record not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Update failed' });
  }
});

module.exports = router;