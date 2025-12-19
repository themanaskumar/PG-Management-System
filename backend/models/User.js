const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String, required: true },
  
  // Room & Deposit
  roomNo: { type: String, required: true },
  deposit: { type: Number, default: 0 },

  // ID Details
  idType: { type: String, enum: ['aadhar', 'pan', 'voter'], required: true },
  idNumber: { type: String, required: true },

  // --- IMAGE FIELDS ---
  profilePhoto: { 
    type: String, 
    default: "https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg" 
  },
  idProof: { 
    type: String, 
    required: true // Mandatory
  },
  // --------------------

  isAdmin: { type: Boolean, default: false },
  isVerified: { type: Boolean, default: false },
}, { timestamps: true });

// Password match helper
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// --- FIX IS HERE ---
// Removed 'next' parameter. Since it's async, Mongoose waits for the promise.
userSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

module.exports = mongoose.model('User', userSchema);