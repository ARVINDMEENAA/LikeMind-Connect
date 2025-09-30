import mongoose from 'mongoose';
import User from './models/User.js';
import dotenv from 'dotenv';

dotenv.config();

const cleanEmails = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find all users with quoted emails
    const users = await User.find({
      $or: [
        { email: { $regex: /^".*"$/ } },  // emails starting and ending with "
        { email: { $regex: /^'.*'$/ } }   // emails starting and ending with '
      ]
    });

    console.log(`Found ${users.length} users with quoted emails`);

    for (const user of users) {
      const cleanEmail = user.email.replace(/^["']|["']$/g, ''); // Remove quotes from start and end
      console.log(`Cleaning: ${user.email} -> ${cleanEmail}`);
      
      await User.updateOne(
        { _id: user._id },
        { $set: { email: cleanEmail } }
      );
    }

    console.log('✅ Email cleanup completed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

cleanEmails();