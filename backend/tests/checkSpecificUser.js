import mongoose from 'mongoose';
import User from './models/User.js';
import dotenv from 'dotenv';

dotenv.config();

const checkUser = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find the specific user
    const user = await User.findById('68d852dede856919edf8b094');
    
    if (user) {
      console.log('User found:');
      console.log('Email:', JSON.stringify(user.email));
      console.log('Email length:', user.email.length);
      console.log('Email chars:', user.email.split('').map(c => c.charCodeAt(0)));
      
      // Clean the email
      const cleanEmail = user.email.replace(/^["']|["']$/g, '').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
      console.log('Clean email:', cleanEmail);
      
      if (cleanEmail !== user.email) {
        await User.updateOne(
          { _id: user._id },
          { $set: { email: cleanEmail } }
        );
        console.log('✅ Email updated');
      }
    } else {
      console.log('User not found');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

checkUser();