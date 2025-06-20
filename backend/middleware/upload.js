const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const { cloudinary } = require('../config/cloudinary'); // <-- fix here

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'HiddenSpots',
    allowed_formats: ['jpg', 'png', 'jpeg'],
  },
});

const upload = multer({ storage });

module.exports = upload;
