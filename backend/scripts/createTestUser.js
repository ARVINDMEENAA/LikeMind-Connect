import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from './models/User.js';
import dotenv from 'dotenv';

dotenv.config();

async function createUser() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const hashedPassword = await bcrypt.hash('123456', 10);
    
    const user = new User({
      name: 'Test User',
      email: 'test123@gmail.com',
      password: hashedPassword
    });
    
    await user.save();
    console.log('✅ User created: test123@gmail.com / 123456');
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

createUser();