const mongoose = require('mongoose');

const billSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  roomNo: { 
    type: String, 
    required: true 
  },
  month: { 
    type: String, 
    required: true 
  }, // e.g., "January"
  year: { 
    type: Number, 
    required: true 
  },  // e.g., 2025
  amount: { 
    type: Number, 
    required: true 
  },
  type: { 
    type: String, 
    default: 'Rent' 
  }, // Future proofing: could be 'Electricity', 'Mess', etc.
  status: { 
    type: String, 
    enum: ['Unpaid', 'Paid'], 
    default: 'Unpaid' 
  },
  dueDate: { 
    type: Date, 
    required: true 
  }
}, { timestamps: true });

module.exports = mongoose.model('Bill', billSchema);