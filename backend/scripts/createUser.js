import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from './models/User.js';
import dotenv from 'dotenv';

dotenv.config();

async function createUser() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const hashedPassword = await bcrypt.hash('123456', 10);
    
    const user = new User({
      name: 'Abdul Test',
      email: 'abdul@gmail.com',
      password: hashedPassword
    });
    
    await user.save();
    console.log('✅ User created successfully:', user.email);
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
}

createUser();