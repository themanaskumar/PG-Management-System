const User = require('../models/User');
const Room = require('../models/Room');

// --- 1. CREATE TENANT ---
exports.createTenant = async (req, res) => {
  try {
    const { name, email, phone, roomNo, idType, idNumber, deposit } = req.body;

    // A. Check if ID Proof is uploaded (Mandatory)
    if (!req.files || !req.files.idProof) {
      return res.status(400).json({ message: "ID Proof document is mandatory." });
    }

    // B. Check if Room exists and is Vacant
    const room = await Room.findOne({ roomNo });
    if (!room) {
      return res.status(404).json({ message: "Room not found." });
    }
    if (room.status === 'Occupied') {
      return res.status(400).json({ message: "Room is already occupied." });
    }

    // C. Get URLs (Middleware already uploaded them)
    const idProofUrl = req.files.idProof[0].path;
    
    let profilePhotoUrl = "";
    if (req.files.profilePhoto) {
      profilePhotoUrl = req.files.profilePhoto[0].path;
    }

    // --- NEW PASSWORD LOGIC ---
    // Extract everything before the '@' symbol
    // Example: "john.doe@gmail.com" -> password is "john.doe"
    const defaultPassword = email.split('@')[0];

    // D. Create User
    const newTenant = new User({
      name,
      email,
      password: defaultPassword, // Plain text (Model will hash it)
      phone,
      roomNo,
      deposit: deposit || 0,
      idType,
      idNumber,
      idProof: idProofUrl,
      profilePhoto: profilePhotoUrl || undefined
    });

    await newTenant.save();

    // E. Update Room Status to Occupied
    room.status = 'Occupied';
    room.currentTenant = newTenant._id;
    await room.save();

    res.status(201).json({ 
      message: `Tenant created. Password set to: ${defaultPassword}`, 
      tenant: newTenant 
    });

  } catch (error) {
    console.error("Error creating tenant:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ... (Keep getAllTenants, deleteTenant, getAllRooms, seedRooms exactly as they were)
exports.getAllTenants = async (req, res) => {
  try {
    const tenants = await User.find({ isAdmin: false }).select('-password');
    res.json(tenants);
  } catch (error) {
    res.status(500).json({ message: "Error fetching tenants" });
  }
};

exports.deleteTenant = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (user) {
      const room = await Room.findOne({ roomNo: user.roomNo });
      if (room) {
        room.status = 'Vacant';
        room.currentTenant = null; 
        await room.save();
      }
      await User.findByIdAndDelete(req.params.id);
      res.json({ message: 'Tenant removed and room freed' });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: "Error deleting tenant" });
  }
};

exports.getAllRooms = async (req, res) => {
  try {
    const rooms = await Room.find({}).sort({ roomNo: 1 }).populate('currentTenant', 'name');
    res.json(rooms);
  } catch (error) {
    res.status(500).json({ message: "Error fetching rooms" });
  }
};

exports.seedRooms = async (req, res) => {
  try {
    const rooms = [];
    for (let f = 1; f <= 3; f++) {
      for (let r = 1; r <= 5; r++) {
        rooms.push({ roomNo: `${f}0${r}`, floor: f, status: 'Vacant' });
      }
    }
    await Room.deleteMany({}); 
    await Room.insertMany(rooms);
    res.json({ message: '15 Rooms Created Successfully' });
  } catch (error) {
    res.status(500).json({ message: "Error seeding rooms" });
  }
};