const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware'); // Ensure this points to your multer config
const { 
  createTenant, 
  getAllTenants, 
  deleteTenant, 
  getAllRooms, 
  seedRooms,
  getPastTenants
} = require('../controllers/adminController');
const { changeTenantRoom } = require('../controllers/adminController');
const { updateRoomPrice, createElectricityBill, createNotice, getNotices } = require('../controllers/adminController');

// Configuration for uploading multiple files
const tenantUploads = upload.fields([
  { name: 'profilePhoto', maxCount: 1 },
  { name: 'idProof', maxCount: 1 }
]);

// --- ROUTES ---

// Manage Tenants
router.post('/create-tenant', protect, admin, tenantUploads, createTenant); // NEW
router.get('/tenants', protect, admin, getAllTenants);
router.delete('/tenants/:id', protect, admin, deleteTenant);
router.put('/tenants/:id/change-room', protect, admin, changeTenantRoom);

// Manage Rooms
router.get('/rooms', protect, admin, getAllRooms);
router.put('/rooms/:roomNo', protect, admin, updateRoomPrice); // Update price
router.post('/seed-rooms', protect, admin, seedRooms); // Added protect/admin for safety
router.get('/history', protect, admin, getPastTenants);

// Electricity Bills
router.post('/electricity', protect, admin, createElectricityBill);

// Notices
router.post('/notices', protect, admin, createNotice);
router.get('/notices', protect, getNotices);
router.delete('/notices/:id', protect, admin, async (req, res) => {
  try {
    const noticeId = req.params.id;
    const Notice = require('../models/Notice');
    console.log('DELETE /admin/notices/:id called by user:', req.user?._id);
    const deleted = await Notice.findByIdAndDelete(noticeId);
    if (!deleted) return res.status(404).json({ message: 'Notice not found' });
    res.json({ message: 'Notice deleted' });
  } catch (error) {
    console.error('Error deleting notice:', error);
    res.status(500).json({ message: error.message || 'Failed to delete' });
  }
});

module.exports = router;