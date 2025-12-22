const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Room = require('../models/Room');
// Ensure User model is registered before populate
const User = require('../models/User');

const run = async () => {
  try {
    // Load env from root .env if available
    require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });
    await connectDB();
    console.log('Starting room tenantCount/status reconciliation...');

    const rooms = await Room.find({}).populate('currentTenants', '_id');
    let changed = 0;
    for (const room of rooms) {
      const valid = (room.currentTenants || []).filter(Boolean);
      const count = valid.length;
      const desiredStatus = count === 0 ? 'Vacant' : count === 1 ? 'Partially Occupied' : 'Occupied';
      if (room.tenantCount !== count || room.status !== desiredStatus) {
        await Room.findByIdAndUpdate(room._id, { tenantCount: count, status: desiredStatus });
        console.log(`Updated room ${room.roomNo}: tenantCount ${room.tenantCount} -> ${count}, status ${room.status} -> ${desiredStatus}`);
        changed++;
      }
    }

    console.log(`Migration complete. Rooms checked: ${rooms.length}. Rooms updated: ${changed}.`);
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
};

run();
