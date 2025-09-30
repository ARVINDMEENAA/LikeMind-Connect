import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from './models/User.js';
import dotenv from 'dotenv';

dotenv.config();

const fixPasswords = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/likemind-connect');
    
    const users = await User.find({});
    console.log(`Found ${users.length} users`);
    
    for (const user of users) {
      // Reset to a known password for all users
      const newPassword = 'password123';
      const hashedPassword = await bcrypt.hash(newPassword, 12);
      
      await User.findByIdAndUpdate(user._id, { 
        password: hashedPassword 
      });
      
      console.log(`Fixed password for user: ${user.email}`);
    }
    
    console.log('All passwords fixed. Default password: password123');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

fixPasswords();