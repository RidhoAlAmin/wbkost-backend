const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Database connection
const connectDB = require('./config/database');

// Force check MONGODB_URI before starting
if (!process.env.MONGODB_URI) {
  console.error('❌ MONGODB_URI environment variable is required');
  console.error('💡 Please set MONGODB_URI in your environment variables');
  process.exit(1);
}

console.log('🔧 Environment Check:');
console.log('   NODE_ENV:', process.env.NODE_ENV);
console.log('   PORT:', process.env.PORT);
console.log('   MONGODB_URI:', process.env.MONGODB_URI ? '✅ Set' : '❌ Missing');

// Connect to database
connectDB();

// Route imports
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const postRoutes = require('./routes/postRoutes');

const app = express();

// =======================
// MIDDLEWARE
// =======================
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://wbkost.vercel.app',
    'https://wbkost-frontend.vercel.app'
  ],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// =======================
// BASIC TEST ROUTES
// =======================

// Root route - Server status
app.get('/', (req, res) => {
  const mongoose = require('mongoose');
  
  res.json({ 
    success: true,
    message: '🎉 WBKost Server BERHASIL JALAN!',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    database: {
      connected: mongoose.connection.readyState === 1,
      host: mongoose.connection.host,
      name: mongoose.connection.name
    },
    endpoints: {
      auth: '/api/auth',
      products: '/api/products',
      posts: '/api/posts',
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
        host: mongoose.connection.host,
        connectionString: process.env.MONGODB_URI ? '✅ Set' : '❌ Missing'
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

// Post model test route
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
      environment: process.env.NODE_ENV,
      port: process.env.PORT
    },
    database: {
      connected: mongoose.connection.readyState === 1,
      name: mongoose.connection.name,
      host: mongoose.connection.host,
      readyState: mongoose.connection.readyState
    },
    features: {
      authentication: true,
      productManagement: true,
      communityPosts: true,
      fileUpload: true
    },
    environment: {
      MONGODB_URI: process.env.MONGODB_URI ? '✅ Set' : '❌ Missing',
      JWT_SECRET: process.env.JWT_SECRET ? '✅ Set' : '❌ Missing',
      NODE_ENV: process.env.NODE_ENV || 'development'
    }
  });
});

// =======================
// MOUNT MAIN ROUTES
// =======================
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/posts', postRoutes);

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
      posts: [
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
        'GET /test-post-model',
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
  
  // MongoDB connection error
  if (err.name === 'MongoNetworkError' || err.name === 'MongoTimeoutError') {
    return res.status(500).json({
      success: false,
      error: 'Database connection failed. Please check your MONGODB_URI.'
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
// GRACEFUL SHUTDOWN
// =======================
process.on('SIGINT', async () => {
  console.log('\n⚠️  Shutting down server gracefully...');
  const mongoose = require('mongoose');
  await mongoose.connection.close();
  console.log('✅ MongoDB connection closed.');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n⚠️  Server terminated gracefully...');
  const mongoose = require('mongoose');
  await mongoose.connection.close();
  console.log('✅ MongoDB connection closed.');
  process.exit(0);
});

// =======================
// START SERVER
// =======================
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  const mongoose = require('mongoose');
  
  console.log('='.repeat(60));
  console.log('🚀 WBKOST SERVER STARTED SUCCESSFULLY!');
  console.log('📡 Server URL: http://localhost:' + PORT);
  console.log('🌍 Environment: ' + (process.env.NODE_ENV || 'development'));
  console.log('⏰ Started at: ' + new Date().toISOString());
  console.log('💾 Database: ' + (mongoose.connection.host || 'Connecting...'));
  console.log('='.repeat(60));
  console.log('🔧 Environment Check:');
  console.log('   MONGODB_URI:', process.env.MONGODB_URI ? '✅ Set' : '❌ MISSING!');
  console.log('   JWT_SECRET:', process.env.JWT_SECRET ? '✅ Set' : '❌ MISSING!');
  console.log('   NODE_ENV:', process.env.NODE_ENV || 'development');
  console.log('='.repeat(60));
  console.log('📋 Available Test Routes:');
  console.log('   GET  /                 - Server status');
  console.log('   GET  /test-db          - Database connection test');
  console.log('   GET  /test-user-model  - User model test');
  console.log('   GET  /test-product-model - Product model test');
  console.log('   GET  /test-post-model  - Post model test');
  console.log('   GET  /server-info      - Server information');
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