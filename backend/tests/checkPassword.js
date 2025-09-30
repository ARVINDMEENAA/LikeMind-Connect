import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from './models/User.js';
import dotenv from 'dotenv';

dotenv.config();

async function checkPasswords() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const users = await User.find({}, 'email password');
    
    for (const user of users) {
      console.log(`\n📧 Email: ${user.email}`);
      
      const passwords = ['123456', 'password', 'test', 'password123', 'admin', '12345'];
      
      for (const pwd of passwords) {
        const match = await bcrypt.compare(pwd, user.password);
        if (match) {
          console.log(`✅ Correct password: "${pwd}"`);
          break;
        }
      }
    }
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

checkPasswords();