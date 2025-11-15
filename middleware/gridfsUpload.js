const multer = require('multer');
const { GridFsStorage } = require('multer-gridfs-storage');
const mongoose = require('mongoose');
const path = require('path');

// Create GridFS storage engine
const storage = new GridFsStorage({
  url: process.env.MONGODB_URI,
  options: { useNewUrlParser: true, useUnifiedTopology: true },
  file: (req, file) => {
    return new Promise((resolve, reject) => {
      // Generate unique filename
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const safeFilename = file.originalname.replace(/[^a-zA-Z0-9.\-]/g, '_');
      const filename = `wbkost_${uniqueSuffix}_${safeFilename}`;
      
      const fileInfo = {
        filename: filename,
        bucketName: 'files', // GridFS collection name
        metadata: {
          userId: req.userId,
          originalName: file.originalname,
          mimeType: file.mimetype,
          uploadedBy: req.userId,
          uploadDate: new Date()
        }
      };
      resolve(fileInfo);
    });
  }
});

// File filter untuk security
const fileFilter = (req, file, cb) => {
  // Allowed file types untuk web templates
  const allowedMimes = [
    'application/zip',
    'application/x-zip-compressed', 
    'application/x-rar-compressed',
    'text/html',
    'text/css',
    'application/javascript',
    'application/json',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'text/plain'
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type not allowed: ${file.mimetype}. Only web files and images are allowed.`), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max file size
  },
  fileFilter: fileFilter
});

// Error handling middleware
const handleUploadErrors = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File too large. Maximum size is 50MB.'
      });
    }
  } else if (err) {
    return res.status(400).json({
      success: false,
      error: err.message
    });
  }
  next();
};

module.exports = {
  upload,
  handleUploadErrors
};