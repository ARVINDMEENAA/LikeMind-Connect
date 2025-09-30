import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from './models/User.js';

// Test login
const testLogin = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/likemind-connect');
    console.log('MongoDB connected');
    
    // Check if user exists
    const user = await User.findOne({ email: 'test@test.com' });
    if (!user) {
      console.log('User not found');
      return;
    }
    
    console.log('User found:', user.email);
    
    // Test password
    const isMatch = await bcrypt.compare('123456', user.password);
    console.log('Password match:', isMatch);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    mongoose.disconnect();
  }
};

testLogin();