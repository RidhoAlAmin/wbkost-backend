const Post = require('../models/Post');

// @desc    Create new post
// @route   POST /api/posts
// @access  Private
const createPost = async (req, res) => {
  try {
    const { content, parentPost, media = [] } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Post content is required'
      });
    }

    if (content.length > 280) {
      return res.status(400).json({
        success: false,
        error: 'Post content cannot exceed 280 characters'
      });
    }

    // Auto-detect hashtags
    const hashtags = content.match(/#[\w]+/g) || [];
    const cleanHashtags = hashtags.map(tag => tag.replace('#', '').toLowerCase());

    // Auto-detect mentions
    const mentions = content.match(/@[\w]+/g) || [];

    const post = await Post.create({
      content: content.trim(),
      author: req.userId,
      hashtags: cleanHashtags,
      mentions: mentions.map(mention => ({
        username: mention.replace('@', '')
      })),
      parentPost: parentPost || null,
      isThread: !!parentPost,
      media
    });

    await post.populate('author', 'username profile');

    res.status(201).json({
      success: true,
      message: 'Post created successfully!',
      data: { post }
    });

  } catch (error) {
    console.error('Create Post Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create post'
    });
  }
};

// @desc    Get all posts (timeline)
// @route   GET /api/posts
// @access  Public
const getPosts = async (req, res) => {
  try {
    const { page = 1, limit = 20, hashtag } = req.query;

    const filter = {};
    if (hashtag) {
      filter.hashtags = hashtag.toLowerCase();
    }

    const posts = await Post.find(filter)
      .populate('author', 'username profile avatar')
      .populate('engagement.likes', 'username')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Post.countDocuments(filter);

    res.json({
      success: true,
      data: {
        posts,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });

  } catch (error) {
    console.error('Get Posts Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch posts'
    });
  }
};

// @desc    Like/unlike post
// @route   POST /api/posts/:id/like
// @access  Private
const toggleLike = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Post not found'
      });
    }

    const hasLiked = post.engagement.likes.includes(req.userId);

    if (hasLiked) {
      // Unlike
      post.engagement.likes = post.engagement.likes.filter(
        userId => userId.toString() !== req.userId
      );
    } else {
      // Like
      post.engagement.likes.push(req.userId);
    }

    await post.save();

    res.json({
      success: true,
      message: hasLiked ? 'Post unliked' : 'Post liked',
      data: {
        likes: post.engagement.likes.length,
        hasLiked: !hasLiked
      }
    });

  } catch (error) {
    console.error('Toggle Like Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to toggle like'
    });
  }
};

module.exports = {
  createPost,
  getPosts,
  toggleLike
};