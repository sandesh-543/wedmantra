const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const CloudinaryService = {
  async uploadImage(filePath, options = {}) {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload(
        filePath,
        { folder: options.folder || 'products', ...options },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      );
    });
  },
  // Add more methods as needed (delete, transform, etc.)
};

module.exports = CloudinaryService; 