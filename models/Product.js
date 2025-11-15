const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Product title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Product description is required'],
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  price: {
    type: Number,
    required: [true, 'Product price is required'],
    min: [0, 'Price cannot be negative']
  },
  category: {
    type: String,
    required: true,
    enum: {
      values: ['website', 'template', 'component', 'plugin', 'mobile', 'other'],
      message: 'Category is not supported'
    }
  },
  files: [{
    filename: String,
    originalName: String,
    fileSize: Number,
    mimeType: String,
    downloadUrl: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  previewImages: [{
    url: String,
    alt: String
  }],
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tags: [String],
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  },
  featured: {
    type: Boolean,
    default: false
  },
  downloadCount: {
    type: Number,
    default: 0
  },
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// Index untuk searching
productSchema.index({ title: 'text', description: 'text', tags: 'text' });
productSchema.index({ seller: 1, createdAt: -1 });
productSchema.index({ category: 1, status: 1 });

module.exports = mongoose.model('Product', productSchema);