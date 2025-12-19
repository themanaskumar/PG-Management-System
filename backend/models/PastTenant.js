const mongoose = require('mongoose');

const pastTenantSchema = new mongoose.Schema({
  originalId: { type: String, required: true }, // The old User ID
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  roomNo: { type: String, required: true },
  
  // ID & Photos (We keep the URLs)
  idType: { type: String },
  idNumber: { type: String },
  idProof: { type: String },
  profilePhoto: { type: String },
  
  // Stay Details
  joinedAt: { type: Date }, // When they were created
  leftAt: { type: Date, default: Date.now }, // Today
  
  // Financial Summary (Optional but good)
  deposit: { type: Number },
  reasonForLeaving: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('PastTenant', pastTenantSchema);