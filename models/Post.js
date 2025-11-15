const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
    maxlength: 280 // X-style character limit
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  media: [{
    type: String, // URL to uploaded media
    caption: String
  }],
  hashtags: [String],
  mentions: [{
    userId: mongoose.Schema.Types.ObjectId,
    username: String
  }],
  parentPost: { // For replies/threads
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post'
  },
  isThread: {
    type: Boolean,
    default: false
  },
  engagement: {
    likes: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    reposts: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    replies: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post'
    }],
    views: {
      type: Number,
      default: 0
    }
  },
  visibility: {
    type: String,
    enum: ['public', 'followers', 'private'],
    default: 'public'
  }
}, {
  timestamps: true
});

// Index untuk searching dan performance
postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ hashtags: 1 });
postSchema.index({ 'engagement.likes': 1 });

module.exports = mongoose.model('Post', postSchema);