const mongoose = require('mongoose');
const { GridFSBucket } = require('mongodb');
const { uploadToGridFS } = require('../middleware/gridfsUpload');

let gridFSBucket;

// Initialize GridFS
mongoose.connection.once('open', () => {
  gridFSBucket = new GridFSBucket(mongoose.connection.db, {
    bucketName: 'files'
  });
});

// @desc    Upload file to Cloud Storage
// @route   POST /api/files/upload
// @access  Private
const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    const metadata = {
      userId: req.userId,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      uploadedBy: req.userId,
      uploadDate: new Date()
    };

    const filename = `wbkost_${Date.now()}_${req.file.originalname.replace(/[^a-zA-Z0-9.\-]/g, '_')}`;

    // Upload to GridFS
    const file = await uploadToGridFS(
      req.file.buffer,
      filename,
      metadata
    );

    res.status(201).json({
      success: true,
      message: 'File uploaded successfully to cloud storage!',
      data: {
        fileId: file._id,
        filename: file.filename,
        originalName: req.file.originalname,
        size: file.length,
        mimeType: req.file.mimetype,
        uploadDate: new Date()
      }
    });

  } catch (error) {
    console.error('Upload Error:', error);
    res.status(500).json({
      success: false,
      error: 'File upload failed'
    });
  }
};

// @desc    Get all user files
// @route   GET /api/files/my-files
// @access  Private
const getMyFiles = async (req, res) => {
  try {
    const files = await mongoose.connection.db.collection('files.files')
      .find({ 'metadata.userId': req.userId })
      .sort({ uploadDate: -1 })
      .toArray();

    const filesWithUrl = files.map(file => ({
      id: file._id,
      filename: file.filename,
      originalName: file.metadata.originalName,
      size: file.length,
      mimeType: file.metadata.mimeType,
      uploadDate: file.uploadDate,
      downloadUrl: `/api/files/download/${file.filename}`,
      isInUse: false
    }));

    res.json({
      success: true,
      data: {
        files: filesWithUrl,
        totalFiles: filesWithUrl.length,
        totalSize: filesWithUrl.reduce((sum, file) => sum + file.size, 0)
      }
    });

  } catch (error) {
    console.error('Get Files Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch files'
    });
  }
};

// @desc    Download file
// @route   GET /api/files/download/:filename
// @access  Private
const downloadFile = async (req, res) => {
  try {
    const filename = req.params.filename;
    
    const file = await mongoose.connection.db.collection('files.files')
      .findOne({ filename: filename });

    if (!file) {
      return res.status(404).json({
        success: false,
        error: 'File not found'
      });
    }

    // Check permission
    if (file.metadata.userId !== req.userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    // Set download headers
    res.set('Content-Type', file.metadata.mimeType);
    res.set('Content-Disposition', `attachment; filename="${file.metadata.originalName}"`);
    res.set('Content-Length', file.length);

    // Stream file to response
    const downloadStream = gridFSBucket.openDownloadStream(file._id);
    
    downloadStream.on('error', () => {
      res.status(404).json({
        success: false,
        error: 'File not found'
      });
    });

    downloadStream.pipe(res);

  } catch (error) {
    console.error('Download Error:', error);
    res.status(500).json({
      success: false,
      error: 'Download failed'
    });
  }
};

// @desc    Delete file (move to trash)
// @route   DELETE /api/files/:filename
// @access  Private
const deleteFile = async (req, res) => {
  try {
    const filename = req.params.filename;
    
    const file = await mongoose.connection.db.collection('files.files')
      .findOne({ filename: filename });

    if (!file) {
      return res.status(404).json({
        success: false,
        error: 'File not found'
      });
    }

    // Check permission
    if (file.metadata.userId !== req.userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    // Soft delete - mark as deleted but keep in storage
    await mongoose.connection.db.collection('files.files')
      .updateOne(
        { filename: filename },
        { 
          $set: { 
            'metadata.deleted': true,
            'metadata.deletedAt': new Date()
          } 
        }
      );

    res.json({
      success: true,
      message: 'File moved to trash. It will be permanently deleted after 30 days.'
    });

  } catch (error) {
    console.error('Delete Error:', error);
    res.status(500).json({
      success: false,
      error: 'Delete failed'
    });
  }
};

// @desc    Get file info
// @route   GET /api/files/info/:filename
// @access  Private
const getFileInfo = async (req, res) => {
  try {
    const filename = req.params.filename;
    
    const file = await mongoose.connection.db.collection('files.files')
      .findOne({ filename: filename });

    if (!file) {
      return res.status(404).json({
        success: false,
        error: 'File not found'
      });
    }

    // Check permission
    if (file.metadata.userId !== req.userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: {
        id: file._id,
        filename: file.filename,
        originalName: file.metadata.originalName,
        size: file.length,
        mimeType: file.metadata.mimeType,
        uploadDate: file.uploadDate,
        metadata: file.metadata
      }
    });

  } catch (error) {
    console.error('File Info Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get file info'
    });
  }
};

module.exports = {
  uploadFile,
  getMyFiles,
  downloadFile,
  deleteFile,
  getFileInfo
};