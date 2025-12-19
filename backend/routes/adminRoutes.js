const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware'); // Ensure this points to your multer config
const { 
  createTenant, 
  getAllTenants, 
  deleteTenant, 
  getAllRooms, 
  seedRooms 
} = require('../controllers/adminController');

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

// Manage Rooms
router.get('/rooms', protect, admin, getAllRooms);
router.post('/seed-rooms', protect, admin, seedRooms); // Added protect/admin for safety

module.exports = router;