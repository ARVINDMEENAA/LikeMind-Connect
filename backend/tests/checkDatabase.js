import mongoose from 'mongoose';
import User from './models/User.js';
import { decrypt } from './utils/encryption.js';
import dotenv from 'dotenv';

dotenv.config();

const checkDatabase = async () => {
  try {
    // Connect to MongoDB
    const mongoUri = decrypt(process.env.MONGODB_URI);
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');
    
    // Count total users
    const userCount = await User.countDocuments();
    console.log(`📊 Total users in database: ${userCount}`);
    
    // Find all users
    const users = await User.find({}).select('name email emailVerified createdAt');
    console.log('👥 All users:');
    users.forEach((user, index) => {
      console.log(`${index + 1}. Name: ${user.name}, Email: ${user.email}, Verified: ${user.emailVerified}, Created: ${user.createdAt}`);
    });
    
    // Check for specific email
    const testEmail = 'abcd@gmail.com';
    const existingUser = await User.findOne({ 
      $or: [
        { email: testEmail },
        { email: `"${testEmail}"` },
        { email: `'${testEmail}'` }
      ]
    });
    
    console.log(`🔍 Checking for ${testEmail}:`, existingUser ? 'EXISTS' : 'NOT FOUND');
    
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
};

checkDatabase();