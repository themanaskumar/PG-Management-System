const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const Bill = require('../models/Bill');
const Rent = require('../models/Rent');
const { protect } = require('../middleware/authMiddleware');

const instance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// 1. Create Order (Securely fetches amount from DB)
router.post('/create-order', protect, async (req, res) => {
  try {
    const { billId } = req.body;
    const bill = await Bill.findById(billId);

    if (!bill) return res.status(404).json({ message: 'Bill not found' });
    if (bill.status === 'Paid') return res.status(400).json({ message: 'Already paid' });

    // Amount must be in "Paise" (₹100 = 10000 paise)
    const options = {
      amount: bill.amount * 100, 
      currency: "INR",
      receipt: `receipt_${billId}`,
    };

    const order = await instance.orders.create(options);

    res.json({
      orderId: order.id,
      amount: options.amount,
      currency: "INR",
      billId: bill._id,
      user_name: req.user.name,
      user_email: req.user.email,
      user_phone: req.user.phone
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Order creation failed' });
  }
});

// 2. Verify Payment (Signature Check)
router.post('/verify', protect, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, billId } = req.body;

    // Verify Signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ message: 'Invalid Signature' });
    }

    // Success: Update DB
    const bill = await Bill.findById(billId);
    bill.status = 'Paid';
    await bill.save();

    // Auto-create Rent Record (No Image Needed)
    await Rent.create({
      user: req.user._id,
      month: bill.month,
      year: bill.year,
      amount: bill.amount,
      proofUrl: 'Paid via Razorpay', 
      status: 'Approved' 
    });

    res.json({ message: 'Payment Verified' });

  } catch (error) {
    res.status(500).json({ message: 'Verification failed' });
  }
});

module.exports = router;