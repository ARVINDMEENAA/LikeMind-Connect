import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import User from './models/User.js';
import dotenv from 'dotenv';

dotenv.config();

const resetAllPasswords = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/likemind-connect');
    console.log('Connected to MongoDB');
    
    const users = await User.find({});
    console.log(`Found ${users.length} users`);
    
    for (const user of users) {
      const defaultPassword = '123456';
      const hashedPassword = await bcrypt.hash(defaultPassword, 12);
      
      await User.findByIdAndUpdate(user._id, { password: hashedPassword });
      console.log(`Reset password for: ${user.email}`);
    }
    
    console.log('All passwords reset to: 123456');
    mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

resetAllPasswords();