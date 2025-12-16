const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); // Ensure bcryptjs is installed

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String, required: true },
  roomNo: { type: String, required: true },
  idType: { type: String, enum: ['aadhar', 'pan', 'voter'] },
  idNumber: { type: String },
  deposit: { type: Number, default: 0 },
  isAdmin: { type: Boolean, default: false },
  isVerified: { type: Boolean, default: false }, // For admin to approve tenant
}, { timestamps: true });

// Password match helper
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Hash password before save
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

module.exports = mongoose.model('User', userSchema);