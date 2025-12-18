const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  roomNo: { 
    type: String, 
    required: true 
  }, // Changed from 'title' to 'roomNo'
  description: { 
    type: String, 
    required: true 
  },
  imageUrl: { 
    type: String, 
    required: false // Optional field
  },
  status: { 
    type: String, 
    enum: ['Open', 'Resolved'], 
    default: 'Open' 
  },
}, { timestamps: true });

module.exports = mongoose.model('Complaint', complaintSchema);