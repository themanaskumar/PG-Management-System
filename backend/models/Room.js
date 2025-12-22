const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  roomNo: { type: String, required: true, unique: true },
  floor: { type: Number, required: true },
  status: { type: String, enum: ['Vacant', 'Partially Occupied', 'Occupied'], default: 'Vacant' },
  currentTenants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Support up to 2 tenants per room
  tenantCount: { type: Number, default: 0 },
  price: { type: Number, default: 1500 } // Monthly rent per bed (admin adjustable)
}, { timestamps: true });

module.exports = mongoose.model('Room', roomSchema);