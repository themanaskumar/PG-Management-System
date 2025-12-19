const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const Bill = require('../models/Bill');
const Rent = require('../models/Rent');
const { protect } = require('../middleware/authMiddleware');
const sendEmail = require('../utils/sendEmail'); // Import Email Helper

// Initialize Razorpay
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

    // Amount must be in "Paise" (₹1 = 100 paise)
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

// 2. Verify Payment (Signature Check & Receipt Email)
router.post('/verify', protect, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, billId } = req.body;

    // A. Verify Signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ message: 'Invalid Signature' });
    }

    // B. Mark Bill as Paid
    const bill = await Bill.findById(billId);
    bill.status = 'Paid';
    await bill.save();

    // C. Create Rent History Record (Auto-Approved)
    await Rent.create({
      user: req.user._id,
      month: bill.month,
      year: bill.year,
      amount: bill.amount,
      proofUrl: 'Paid via Razorpay Online', 
      status: 'Approved' 
    });

    // D. Send Receipt Email
    const receiptSubject = `Payment Receipt - ${bill.month} ${bill.year}`;
    const receiptBody = `Dear ${req.user.name},\n\nWe have successfully received your payment of ₹${bill.amount} for the month of ${bill.month} ${bill.year}.\n\nTransaction ID: ${razorpay_payment_id}\nDate: ${new Date().toDateString()}\n\nThank you for paying on time!\n\nRegards,\nPG Management Team`;

    // Fire and forget (don't await so the UI responds faster)
    sendEmail(req.user.email, receiptSubject, receiptBody).catch(err => console.error("Email failed:", err));

    res.json({ message: 'Payment Verified Successfully' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Verification failed' });
  }
});

module.exports = router;