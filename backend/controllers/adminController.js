const User = require('../models/User');
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const Room = require('../models/Room');
const Bill = require('../models/Bill');
const Notice = require('../models/Notice');
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

    // B. Check if Room exists and has capacity
    const room = await Room.findOne({ roomNo });
    if (!room) return res.status(404).json({ message: "Room not found." });
    // Allow up to 2 tenants per room
    if (room.currentTenants && room.currentTenants.length >= 2) {
      return res.status(400).json({ message: "Room is already fully occupied." });
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

    // E. Add tenant to room, update tenantCount and status
    room.currentTenants = room.currentTenants || [];
    room.currentTenants.push(newTenant._id);
    room.tenantCount = room.currentTenants.length;
    if (room.tenantCount === 0) room.status = 'Vacant';
    else if (room.tenantCount === 1) room.status = 'Partially Occupied';
    else room.status = 'Occupied';
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

    // B. Remove tenant from room's tenant list and update status
    const room = await Room.findOne({ roomNo: user.roomNo });
    if (room) {
      room.currentTenants = (room.currentTenants || []).filter(id => id.toString() !== user._id.toString());
      room.tenantCount = room.currentTenants.length;
      if (room.tenantCount === 0) room.status = 'Vacant';
      else if (room.tenantCount === 1) room.status = 'Partially Occupied';
      else room.status = 'Occupied';
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
    const rooms = await Room.find({}).sort({ roomNo: 1 }).populate('currentTenants', 'name');
    // Reconcile tenantCount/status if inconsistent
    for (const room of rooms) {
      const validTenants = (room.currentTenants || []).filter(Boolean);
      const count = validTenants.length;
      if (room.tenantCount !== count ||
          (count === 0 && room.status !== 'Vacant') ||
          (count === 1 && room.status !== 'Partially Occupied') ||
          (count >= 2 && room.status !== 'Occupied')) {
        room.tenantCount = count;
        room.status = count === 0 ? 'Vacant' : count === 1 ? 'Partially Occupied' : 'Occupied';
        // persist correction
        await Room.findByIdAndUpdate(room._id, { tenantCount: room.tenantCount, status: room.status });
      }
    }
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
        rooms.push({ roomNo: `${f}0${r}`, floor: f, status: 'Vacant', currentTenants: [], tenantCount: 0 });
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

// --- 7. UPDATE ROOM PRICE (Admin) ---
exports.updateRoomPrice = async (req, res) => {
  try {
    const { roomNo } = req.params;
    const { price } = req.body;
    const room = await Room.findOne({ roomNo });
    if (!room) return res.status(404).json({ message: 'Room not found' });
    room.price = Number(price) || room.price;
    await room.save();
    res.json(room);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error updating room price' });
  }
};

// --- 8. CREATE ELECTRICITY BILL (Admin) ---
// body: { amount, tenantIds, month, year }
exports.createElectricityBill = async (req, res) => {
  try {
    const { amount, tenantIds, month, year } = req.body;
    if (!amount || !tenantIds || !Array.isArray(tenantIds) || tenantIds.length === 0) {
      return res.status(400).json({ message: 'Amount and tenantIds are required' });
    }

    const share = Math.round((Number(amount) / tenantIds.length) * 100) / 100; // 2 decimals
    const today = new Date();
    const billMonth = month || MONTHS[today.getMonth()];
    const billYear = year || today.getFullYear();
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 7);

    const createdBills = [];
    for (const tenantId of tenantIds) {
      const tenant = await User.findById(tenantId);
      if (!tenant) continue;
      // Avoid duplicate electricity bill for same month/year
      const exists = await Bill.findOne({ user: tenant._id, month: billMonth, year: billYear, type: 'Electricity' });
      if (exists) continue;

      const bill = await Bill.create({
        user: tenant._id,
        roomNo: tenant.roomNo || 'N/A',
        amount: share,
        month: billMonth,
        year: billYear,
        dueDate,
        type: 'Electricity',
        status: 'Unpaid'
      });

      createdBills.push(bill);

      // Notify tenant
      const emailSubject = `Electricity Bill: ${billMonth} ${billYear}`;
      const emailBody = `Hello ${tenant.name},\n\nAn electricity bill of ₹${share} for ${billMonth} ${billYear} has been generated and added to your dashboard. Please pay by ${dueDate.toDateString()}\n\nRegards,\nPG Management Team`;
      await sendEmail(tenant.email, emailSubject, emailBody);
    }

    res.status(201).json({ message: 'Electricity bills created', count: createdBills.length, bills: createdBills });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error creating electricity bills' });
  }
};

// --- 9. NOTICES (Admin Create & Fetch) ---
exports.createNotice = async (req, res) => {
  try {
    const { title, message } = req.body;
    if (!title || !message) return res.status(400).json({ message: 'Title and message required' });
    const notice = await Notice.create({ title, message, createdBy: req.user._id });
    res.status(201).json(notice);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error creating notice' });
  }
};

exports.getNotices = async (req, res) => {
  try {
    const notices = await Notice.find({}).sort({ createdAt: -1 }).populate('createdBy', 'name email');
    res.json(notices);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching notices' });
  }
};

// --- 10. CHANGE TENANT ROOM (Admin) ---
// body: { newRoomNo }
exports.changeTenantRoom = async (req, res) => {
  try {
    const tenantId = req.params.id;
    const { newRoomNo } = req.body;
    if (!newRoomNo) return res.status(400).json({ message: 'newRoomNo is required' });

    const tenant = await User.findById(tenantId);
    if (!tenant) return res.status(404).json({ message: 'Tenant not found' });

    const oldRoom = await Room.findOne({ roomNo: tenant.roomNo });
    const newRoom = await Room.findOne({ roomNo: newRoomNo });
    if (!newRoom) return res.status(404).json({ message: 'Target room not found' });

    // Ensure new room has space (max 2)
    const newCount = (newRoom.currentTenants || []).length;
    if (newCount >= 2) return res.status(400).json({ message: 'Target room is already full' });

    // Remove from old room
    if (oldRoom) {
      oldRoom.currentTenants = (oldRoom.currentTenants || []).filter(id => id.toString() !== tenant._id.toString());
      oldRoom.tenantCount = oldRoom.currentTenants.length;
      oldRoom.status = oldRoom.tenantCount === 0 ? 'Vacant' : oldRoom.tenantCount === 1 ? 'Partially Occupied' : 'Occupied';
      await oldRoom.save();
    }

    // Add to new room
    newRoom.currentTenants = newRoom.currentTenants || [];
    newRoom.currentTenants.push(tenant._id);
    newRoom.tenantCount = newRoom.currentTenants.length;
    newRoom.status = newRoom.tenantCount === 0 ? 'Vacant' : newRoom.tenantCount === 1 ? 'Partially Occupied' : 'Occupied';
    await newRoom.save();

    // Update tenant record
    tenant.roomNo = newRoomNo;
    await tenant.save();

    res.json({ message: 'Tenant room changed successfully', tenant });
  } catch (error) {
    console.error('Error changing tenant room:', error);
    res.status(500).json({ message: error.message || 'Error changing tenant room' });
  }
};