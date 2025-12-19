const User = require('../models/User');
const Room = require('../models/Room');
const sendEmail = require('../utils/sendEmail');
const PastTenant = require('../models/PastTenant');

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

    // C. Get URLs
    const idProofUrl = req.files.idProof[0].path;
    
    let profilePhotoUrl = "";
    if (req.files.profilePhoto) {
      profilePhotoUrl = req.files.profilePhoto[0].path;
    }

    // --- PASSWORD LOGIC ---
    // Example: "john.doe@gmail.com" -> password is "john.doe"
    const defaultPassword = email.split('@')[0];

    // D. Create User
    const newTenant = new User({
      name,
      email,
      password: defaultPassword, // Model will hash this
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

    // --- F. SEND WELCOME EMAIL ---
    const emailSubject = "Welcome to DLF Boys' Hostel - Login Credentials";
    const emailBody = `Hello ${name},

Welcome to DLF Boys' Hostel! Your tenant account has been successfully created.

Here are your login details:
URL: http://localhost:5173/login
Email: ${email}
Password: ${defaultPassword}
Room No: ${roomNo}
ID: ${idType} : ${idNumber}
ID Proof: ${idProofUrl}
Phone No.: ${phone}
Deposit: ${deposit}

IMPORTANT: Please login to your dashboard and change your password immediately under the 'Settings' tab.

Regards,
Zacharias P Thomas`;

    // Send the email (we await it so we know if it fails in the logs)
    await sendEmail(email, emailSubject, emailBody);

    res.status(201).json({ 
      message: `Tenant created. Password set to: ${defaultPassword}`, 
      tenant: newTenant 
    });

  } catch (error) {
    console.error("Error creating tenant:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// --- 2. GET ALL TENANTS ---
exports.getAllTenants = async (req, res) => {
  try {
    const tenants = await User.find({ isAdmin: false }).select('-password');
    res.json(tenants);
  } catch (error) {
    res.status(500).json({ message: "Error fetching tenants" });
  }
};

// --- 3. DELETE TENANT (ARCHIVE & REMOVE) ---
exports.deleteTenant = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // A. Archive to PastTenant Collection
    await PastTenant.create({
      originalId: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      roomNo: user.roomNo,
      idType: user.idType,
      idNumber: user.idNumber,
      idProof: user.idProof,      // Keeping the file URL
      profilePhoto: user.profilePhoto, // Keeping the file URL
      deposit: user.deposit,
      joinedAt: user.createdAt,
      leftAt: new Date()
    });

    // B. Free up the Room
    const room = await Room.findOne({ roomNo: user.roomNo });
    if (room) {
      room.status = 'Vacant';
      room.currentTenant = null; 
      await room.save();
    }

    // C. Delete from Active Users
    // Note: We DO NOT delete the images from Cloudinary here, 
    // because we want them accessible in the PastTenant record.
    await User.findByIdAndDelete(req.params.id);

    res.json({ message: 'Tenant archived to history and room freed.' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error deleting tenant" });
  }
};

// --- 4. GET ALL ROOMS ---
exports.getAllRooms = async (req, res) => {
  try {
    const rooms = await Room.find({}).sort({ roomNo: 1 }).populate('currentTenant', 'name');
    res.json(rooms);
  } catch (error) {
    res.status(500).json({ message: "Error fetching rooms" });
  }
};

// --- 5. SEED ROOMS ---
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

// --- 6. GET PAST TENANTS (HISTORY) ---
exports.getPastTenants = async (req, res) => {
  try {
    // Sort by 'leftAt' descending (most recent leavers first)
    const history = await PastTenant.find({}).sort({ leftAt: -1 });
    res.json(history);
  } catch (error) {
    res.status(500).json({ message: "Error fetching tenant history" });
  }
};