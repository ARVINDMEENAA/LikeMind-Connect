import mongoose from 'mongoose';
import User from './models/User.js';
import dotenv from 'dotenv';

dotenv.config();

const findUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find all users
    const users = await User.find({}).limit(10);
    console.log(`Found ${users.length} users`);

    for (const user of users) {
      console.log('\n--- User ---');
      console.log('ID:', user._id);
      console.log('Email:', JSON.stringify(user.email));
      
      // Check for quoted emails
      if (user.email.includes('"') || user.email.includes("'") || user.email.includes('&quot;') || user.email.includes('&#39;')) {
        console.log('🔍 Found quoted email!');
        const cleanEmail = user.email.replace(/^[\"']|[\"']$/g, '').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
        console.log('Clean email would be:', cleanEmail);
      }
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

findUsers();