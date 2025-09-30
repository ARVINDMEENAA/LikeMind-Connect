import mongoose from 'mongoose';
import User from './models/User.js';
import dotenv from 'dotenv';

dotenv.config();

const verifyUser = async (email) => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      console.log('❌ User not found');
      return;
    }
    
    if (user.isVerified) {
      console.log('✅ User already verified');
      return;
    }
    
    user.isVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();
    
    console.log('✅ User verified successfully!');
    console.log('Now you can login with:', email);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.disconnect();
  }
};

// Get email from command line argument
const email = process.argv[2];
if (!email) {
  console.log('Usage: node verifyTestUser.js <email>');
  process.exit(1);
}

verifyUser(email);