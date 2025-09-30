import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from './models/User.js';
import dotenv from 'dotenv';

dotenv.config();

async function testSpecificUser() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const testEmail = 'test123@gmail.com';
    console.log('Testing login for:', testEmail);
    
    const user = await User.findOne({ email: testEmail });
    if (!user) {
      console.log('User not found');
      process.exit(1);
    }
    
    console.log('User found:', user.name);
    console.log('Stored password hash:', user.password);
    
    // Test the password that was used when creating this user
    const isMatch = await bcrypt.compare('123456', user.password);
    console.log(`Password "123456": ${isMatch ? 'MATCH' : 'NO MATCH'}`);
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

testSpecificUser();