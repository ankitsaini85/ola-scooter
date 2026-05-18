const { v2: cloudinary } = require('cloudinary');

const cloudName = process.env.CLODINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLODINARY_API_KEY || process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLODINARY_API_SECRET_KEY || process.env.CLOUDINARY_API_SECRET_KEY;

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
  secure: true,
});

module.exports = cloudinary;