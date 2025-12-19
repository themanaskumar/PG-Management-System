const express = require('express');
const router = express.Router();
const Rent = require('../models/Rent');
const User = require('../models/User'); 
const Bill = require('../models/Bill'); // Required for Automated Bills
const { protect, admin } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware'); 

// Helper to convert Month Name to Index (0-11)
const getMonthIndex = (monthName) => {
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  return months.indexOf(monthName);
};

// ======================================================
// 1. ADMIN ROUTES (Must be first)
// ======================================================

// GET /api/rent/track?month=December&year=2024
// (Admin Logic to see who has paid and who hasn't)
router.get('/track', protect, admin, async (req, res) => {
  try {
    const { month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({ message: "Month and Year are required" });
    }

    // A. Calculate Date Filter (Last day of selected month)
    const monthIndex = getMonthIndex(month);
    if (monthIndex === -1) {
      return res.status(400).json({ message: "Invalid month name" });
    }
    const filterDate = new Date(parseInt(year), monthIndex + 1, 0, 23, 59, 59);

    // B. Fetch Valid Tenants (Joined before/during selected month)
    const tenants = await User.find({ 
      isAdmin: false,
      createdAt: { $lte: filterDate },
      roomNo: { $ne: null } // Only active tenants with rooms
    }).select('name roomNo email phone');

    // C. Fetch Manual Rent Uploads for that month
    const rentRecords = await Rent.find({ month, year: parseInt(year) });

    // D. Fetch Automated Bills for that month
    const billRecords = await Bill.find({ month, year: parseInt(year) });

    // E. Merge Data
    const report = tenants.map(tenant => {
      // Check Manual Uploads
      const manualRecord = rentRecords.find(r => r.user.toString() === tenant._id.toString());
      // Check Automated Bills
      const billRecord = billRecords.find(b => b.user.toString() === tenant._id.toString());

      // Determine Status & Amount
      let status = 'Not Paid';
      let amount = 0;
      let proofUrl = null;
      let rentId = null;

      // Priority to Manual Uploads (if approved) or Paid Bills
      if (manualRecord) {
        status = manualRecord.status; // 'Pending', 'Approved', 'Rejected'
        amount = manualRecord.amount;
        proofUrl = manualRecord.proofUrl;
        rentId = manualRecord._id;
      } else if (billRecord && billRecord.status === 'Approved') {
        status = 'Paid (Online)';
        amount = billRecord.amount;
        rentId = billRecord._id;
      } else if (billRecord) {
        status = 'Unpaid'; // Bill exists but not paid
        amount = billRecord.amount;
      }

      return {
        tenantId: tenant._id,
        name: tenant.name,
        roomNo: tenant.roomNo,
        phone: tenant.phone,
        status, 
        amount,
        rentId,
        proofUrl,
      };
    });

    res.json(report);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching rent report' });
  }
});

// PUT /api/rent/:id (Admin: Approve/Reject Manual Proof)
router.put('/:id', protect, admin, async (req, res) => {
  try {
    const rent = await Rent.findById(req.params.id);
    if (rent) {
      rent.status = req.body.status || rent.status;
      await rent.save();
      res.json(rent);
    } else {
      res.status(404).json({ message: 'Rent record not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Update failed' });
  }
});

// ======================================================
// 2. TENANT ROUTES
// ======================================================

// GET /api/rent/my-bills (Automated System Bills)
// Used for the Red "Dues" Cards on Dashboard
router.get('/my-bills', protect, async (req, res) => {
  try {
    const bills = await Bill.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(bills);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching bills' });
  }
});

// POST /api/rent (Manual Proof Upload)
router.post('/', protect, upload.single('image'), async (req, res) => {
  try {
    const { month, year, amount } = req.body;
    const proofUrl = req.file ? req.file.path : null; 

    if (!proofUrl) {
      return res.status(400).json({ message: 'Proof image is required' });
    }

    const rent = await Rent.create({
      user: req.user._id,
      name: req.user.name,
      roomNo: req.user.roomNo,
      phone: req.user.phone,
      month, 
      year, 
      amount, 
      proofUrl,
      status: 'Pending'
    });

    res.status(201).json(rent);
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: 'Failed to submit rent' });
  }
});

// GET /api/rent (Manual Upload History)
// Used for the "Rents" Table on Dashboard
router.get('/', protect, async (req, res) => {
  try {
    const rents = await Rent.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(rents);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching rents' });
  }
});

module.exports = router;