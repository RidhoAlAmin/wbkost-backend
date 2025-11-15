const express = require('express');
const {
  uploadFile,
  getMyFiles,
  downloadFile,
  deleteFile,
  getFileInfo
} = require('../controllers/fileController');
const { protect } = require('../middleware/auth');
const { upload, handleUploadErrors } = require('../middleware/gridfsUpload');

const router = express.Router();

// All routes are protected
router.use(protect);

// Upload file to cloud storage
router.post('/upload', upload.single('file'), handleUploadErrors, uploadFile);

// Get user's files
router.get('/my-files', getMyFiles);

// Download file
router.get('/download/:filename', downloadFile);

// Get file info
router.get('/info/:filename', getFileInfo);

// Delete file (soft delete)
router.delete('/:filename', deleteFile);

// Test route
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: '✅ Cloud Storage API is working!',
    endpoints: [
      'POST /api/files/upload',
      'GET /api/files/my-files', 
      'GET /api/files/download/:filename',
      'GET /api/files/info/:filename',
      'DELETE /api/files/:filename'
    ]
  });
});

module.exports = router;