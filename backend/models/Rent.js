const mongoose = require('mongoose');

const rentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  month: { type: String, required: true }, // e.g., "December"
  year: { type: Number, required: true }, // e.g., 2025
  amount: { type: Number, required: true },
  proofUrl: { type: String }, // User pastes a link to Drive/Image
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
}, { timestamps: true });

module.exports = mongoose.model('Rent', rentSchema);