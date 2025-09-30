import mongoose from 'mongoose';
import User from './models/User.js';
import { decrypt } from './utils/encryption.js';
import dotenv from 'dotenv';

dotenv.config();

const cleanDatabase = async () => {
  try {
    const mongoUri = decrypt(process.env.MONGODB_URI);
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');
    
    // Delete all users
    const result = await User.deleteMany({});
    console.log(`🗑️ Deleted ${result.deletedCount} users`);
    
    await mongoose.disconnect();
    console.log('✅ Database cleaned and disconnected');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
};

cleanDatabase();