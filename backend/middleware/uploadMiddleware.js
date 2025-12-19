const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// 1. Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// 2. Configure Storage Settings
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'pg-management-proofs',
    allowed_formats: ['jpg', 'png', 'jpeg', 'pdf'],
  },
});

// 3. Initialize Multer
const upload = multer({ storage: storage });

// --- NEW HELPER: Delete image from Cloudinary ---
// We attach this to the 'upload' object so we can use it in controllers
// without breaking existing "const upload = require(...)" imports.
upload.deleteFromCloudinary = async (imageUrl) => {
  if (!imageUrl || !imageUrl.includes('cloudinary')) return;

  try {
    // Extract Public ID from URL
    // Example: https://.../v12345/pg-management-proofs/abcde.jpg
    // We need: "pg-management-proofs/abcde"
    
    const parts = imageUrl.split('/');
    const fileName = parts.pop(); // "abcde.jpg"
    const folder = parts.pop();   // "pg-management-proofs"
    const publicId = `${folder}/${fileName.split('.')[0]}`;

    await cloudinary.uploader.destroy(publicId);
    console.log(`🗑️ Deleted old image: ${publicId}`);
  } catch (error) {
    console.error("Failed to delete old image:", error);
  }
};

module.exports = upload;