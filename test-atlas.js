require('dotenv').config();
const mongoose = require('mongoose');

console.log('🧪 Testing MongoDB Atlas Connection...\n');

// Connection string - GANTI DENGAN MILIK LO
const MONGODB_URI = 'mongodb+srv://ridhoayu154_db_user:Makantahutempe998@noukuyo.y6gxzau.mongodb.net/wbkost?retryWrites=true&w=majority&appName=Noukuyo';

console.log('🔗 Connection String:', MONGODB_URI.replace(/:[^:@]+@/, ':********@'));
console.log('⏳ Connecting to MongoDB Atlas...\n');

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(async () => {
  console.log('✅ SUCCESS: MongoDB Atlas Connected!');
  console.log('📊 Database:', mongoose.connection.name);
  console.log('🏠 Host:', mongoose.connection.host);
  
  // Test basic operation
  try {
    const Test = mongoose.model('Test', new mongoose.Schema({ 
      name: String,
      timestamp: { type: Date, default: Date.now }
    }));
    
    await Test.create({ name: 'WBKost Connection Test' });
    console.log('✅ Database operations working!');
    
    const count = await Test.countDocuments();
    console.log('📈 Total test documents:', count);
    
  } catch (opError) {
    console.log('⚠️  Basic operations test failed:', opError.message);
  }
  
  mongoose.connection.close();
  console.log('\n🎉 ALL TESTS PASSED! MongoDB Atlas ready for WBKost!');
  process.exit(0);
})
.catch(error => {
  console.error('❌ FAILED: Connection error:', error.message);
  console.log('\n🔧 Troubleshooting:');
  console.log('   1. Check username/password');
  console.log('   2. Check IP whitelist (0.0.0.0/0)');
  console.log('   3. Check database name in connection string');
  process.exit(1);
});