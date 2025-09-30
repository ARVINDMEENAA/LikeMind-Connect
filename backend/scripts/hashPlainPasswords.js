import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import dotenv from 'dotenv';

dotenv.config();

const hashPlainPasswords = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find users with plain text passwords (not starting with $2a$ or $2b$)
    const users = await User.find({
      password: { 
        $not: /^\$2[ab]\$/ 
      }
    });

    console.log(`Found ${users.length} users with plain text passwords`);

    for (const user of users) {
      const hashedPassword = await bcrypt.hash(user.password, 12);
      await User.findByIdAndUpdate(user._id, { password: hashedPassword });
      console.log(`Updated password for user: ${user.email}`);
    }

    console.log('✅ All passwords have been hashed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

hashPlainPasswords();