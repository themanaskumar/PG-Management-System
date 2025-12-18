const cron = require('node-cron');
const User = require('../models/User');
const Bill = require('../models/Bill');
const Room = require('../models/Room'); 

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const generateMonthlyBills = () => {
  // SCHEDULE: Run at 00:00 on the 1st day of every month
  // Syntax: 'minute hour day-of-month month day-of-week'
  cron.schedule('0 0 1 * *', async () => {
    console.log('--- 🤖 Running Monthly Bill Generation ---');
    
    try {
      const today = new Date();
      const currentMonth = MONTHS[today.getMonth()];
      const currentYear = today.getFullYear();
      const dueDate = new Date(today.getFullYear(), today.getMonth(), 5); // Due on 5th

      // 1. Find all Active Tenants (Users who are not admins and have a room)
      const tenants = await User.find({ isAdmin: false, roomNo: { $ne: null } });

      if (tenants.length === 0) {
        console.log('No tenants found to bill.');
        return;
      }

      for (const tenant of tenants) {
        // 2. Fetch Room Rent Details
        const room = await Room.findOne({ roomNo: tenant.roomNo });
        
        // DEFAULT RENT LOGIC:
        // If room has a 'price' or 'rent' field, use it. Otherwise default to 5000.
        const rentAmount = room && room.price ? room.price : 1500;

        // 3. Check for Duplicate Bill (Don't charge twice for same month)
        const exists = await Bill.findOne({ 
          user: tenant._id, 
          month: currentMonth, 
          year: currentYear,
          type: 'Rent' 
        });

        if (!exists) {
          await Bill.create({
            user: tenant._id,
            roomNo: tenant.roomNo,
            amount: rentAmount,
            month: currentMonth,
            year: currentYear,
            dueDate: dueDate,
            type: 'Rent',
            status: 'Unpaid'
          });
          console.log(`✅ Generated bill for ${tenant.name} (${tenant.roomNo}): ₹${rentAmount}`);
        } else {
          console.log(`Skipping ${tenant.name}: Bill already exists.`);
        }
      }
      console.log('--- Bill Generation Complete ---');
    } catch (error) {
      console.error('❌ Error generating bills:', error);
    }
  });
};

module.exports = generateMonthlyBills;