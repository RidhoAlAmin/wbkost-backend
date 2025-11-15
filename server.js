const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Database connection
const connectDB = require('./config/database');
connectDB();

// Route imports
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const postRoutes = require('./routes/postRoutes'); // NEW: Post routes

const app = express();

// =======================
// MIDDLEWARE
// =======================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// =======================
// BASIC TEST ROUTES
// =======================

// Root route - Server status
app.get('/', (req, res) => {
  res.json({ 
    success: true,
    message: '🎉 WBKost Server BERHASIL JALAN!',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    endpoints: {
      auth: '/api/auth',
      products: '/api/products',
      posts: '/api/posts', // NEW: Posts endpoint
      docs: 'Coming soon...'
    }
  });
});

// Database test route
app.get('/test-db', async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const dbStatus = mongoose.connection.readyState;
    const statusMessages = {
      0: 'Disconnected',
      1: 'Connected', 
      2: 'Connecting',
      3: 'Disconnecting'
    };
    
    res.json({
      success: true,
      database: {
        status: statusMessages[dbStatus] || 'Unknown',
        readyState: dbStatus,
        name: mongoose.connection.name,
        host: mongoose.connection.host
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// User model test route
app.get('/test-user-model', async (req, res) => {
  try {
    const User = require('./models/User');
    const userCount = await User.countDocuments();
    
    res.json({
      success: true,
      message: '✅ User Model is working!',
      totalUsers: userCount,
      modelInfo: {
        name: 'User',
        fields: ['username', 'email', 'role', 'profile']
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Product model test route
app.get('/test-product-model', async (req, res) => {
  try {
    const Product = require('./models/Product');
    const productCount = await Product.countDocuments();
    
    res.json({
      success: true,
      message: '✅ Product Model is working!',
      totalProducts: productCount,
      modelInfo: {
        name: 'Product',
        fields: ['title', 'price', 'category', 'seller', 'status']
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Post model test route - NEW
app.get('/test-post-model', async (req, res) => {
  try {
    const Post = require('./models/Post');
    const postCount = await Post.countDocuments();
    
    res.json({
      success: true,
      message: '✅ Post Model is working!',
      totalPosts: postCount,
      modelInfo: {
        name: 'Post',
        fields: ['content', 'author', 'hashtags', 'engagement']
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Server info route
app.get('/server-info', (req, res) => {
  const mongoose = require('mongoose');
  
  res.json({
    success: true,
    server: {
      nodeVersion: process.version,
      platform: process.platform,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      environment: process.env.NODE_ENV
    },
    database: {
      connected: mongoose.connection.readyState === 1,
      name: mongoose.connection.name,
      host: mongoose.connection.host
    },
    features: {
      authentication: true,
      productManagement: true,
      communityPosts: true, // NEW: Posts feature
      fileUpload: true
    }
  });
});

// =======================
// MOUNT MAIN ROUTES
// =======================
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/posts', postRoutes); // NEW: Post routes

// =======================
// ERROR HANDLING
// =======================

// 404 Handler - untuk route yang tidak ada
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false,
    error: '🔍 Route not found',
    requestedUrl: req.originalUrl,
    availableEndpoints: {
      auth: [
        'POST /api/auth/register',
        'POST /api/auth/login', 
        'GET /api/auth/me',
        'GET /api/auth/test'
      ],
      products: [
        'GET /api/products',
        'GET /api/products/:id',
        'GET /api/products/seller/my-products',
        'POST /api/products',
        'PUT /api/products/:id',
        'DELETE /api/products/:id'
      ],
      posts: [ // NEW: Post endpoints
        'GET /api/posts',
        'POST /api/posts',
        'POST /api/posts/:id/like',
        'GET /api/posts/test'
      ],
      test: [
        'GET /',
        'GET /test-db',
        'GET /test-user-model',
        'GET /test-product-model',
        'GET /test-post-model', // NEW: Post test
        'GET /server-info'
      ]
    }
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('🔥 Server Error:', err.stack);
  
  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(val => val.message);
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      details: messages
    });
  }
  
  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({
      success: false,
      error: `Duplicate field value: ${field}. Please use another value.`
    });
  }
  
  // Mongoose cast error (invalid ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      error: 'Invalid ID format'
    });
  }
  
  // Default error
  res.status(500).json({ 
    success: false,
    error: process.env.NODE_ENV === 'production' 
      ? 'Something went wrong!'
      : err.message
  });
});

// =======================
// START SERVER
// =======================
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log('='.repeat(60));
  console.log('🚀 WBKOST SERVER STARTED SUCCESSFULLY!');
  console.log('📡 Server URL: http://localhost:' + PORT);
  console.log('🌍 Environment: ' + (process.env.NODE_ENV || 'development'));
  console.log('⏰ Started at: ' + new Date().toISOString());
  console.log('💾 Database: ' + (process.env.MONGODB_URI || 'mongodb://localhost:27017/wbkost'));
  console.log('='.repeat(60));
  console.log('📋 Available Test Routes:');
  console.log('   GET  /                 - Server status');
  console.log('   GET  /test-db          - Database connection test');
  console.log('   GET  /test-user-model  - User model test');
  console.log('   GET  /test-product-model - Product model test');
  console.log('   GET  /test-post-model  - Post model test'); // NEW
  console.log('   GET  /server-info      - Server information');
  console.log('='.repeat(60));
  console.log('🆕 NEW FEATURES:');
  console.log('   ✅ X-Style Community Posts');
  console.log('   ✅ Like/Engagement System');
  console.log('   ✅ Hashtag & Mention Support');
  console.log('='.repeat(60));
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log('❌ Unhandled Rejection at:', promise, 'reason:', err);
  // Close server & exit process
  server.close(() => {
    process.exit(1);
  });
});

module.exports = app;