const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Use MONGODB_URI from environment, fallback to Atlas for production
    const uri = process.env.MONGODB_URI;
    
    if (!uri) {
      console.error('❌ MONGODB_URI is not defined in environment variables');
      process.exit(1);
    }

    const conn = await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('💡 Check your MONGODB_URI in environment variables');
    process.exit(1);
  }
};

module.exports = connectDB;