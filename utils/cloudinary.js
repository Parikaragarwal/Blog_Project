const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
require("dotenv").config();

// Cloudinary Config
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Storage for Blogs
const blogStorage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: "blogs", // Folder for blog images
        allowed_formats: ["jpg", "jpeg", "png"],
    },
});

// Storage for User Profile Images
const userStorage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: "user_profiles", // Folder for profile images
        allowed_formats: ["jpg", "jpeg", "png"],
        transformation: [{ width: 300, height: 300, crop: "limit" }], // Resize for uniformity
    },
});

// Export both storages
module.exports = { cloudinary, blogStorage, userStorage };
