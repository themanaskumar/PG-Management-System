const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  roomNo: { type: String, required: true, unique: true },
  floor: { type: Number, required: true },
  status: { type: String, enum: ['Vacant', 'Occupied'], default: 'Vacant' },
}, { timestamps: true });

module.exports = mongoose.model('Room', roomSchema);