import mongoose from 'mongoose';
import User from './models/User.js';
import dotenv from 'dotenv';

dotenv.config();

const fixQuotedEmail = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find user with quoted email
    const user = await User.findById('68d5146e8fd946deae38b5a6');
    
    if (user) {
      console.log('Current email:', JSON.stringify(user.email));
      
      const cleanEmail = user.email.replace(/^[\"']|[\"']$/g, '').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
      console.log('Clean email:', cleanEmail);
      
      await User.updateOne(
        { _id: user._id },
        { $set: { email: cleanEmail } }
      );
      console.log('✅ Email fixed!');
    } else {
      console.log('User not found');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

fixQuotedEmail();