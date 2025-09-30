import mongoose from 'mongoose';
import User from '../models/User.js';
import dotenv from 'dotenv';

dotenv.config();

const createAIBot = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const existingBot = await User.findOne({ email: 'aibot@likemind.com' });
    if (existingBot) {
      console.log('AI Bot already exists');
      return existingBot;
    }

    const aiBot = new User({
      name: 'LikeMind AI',
      email: 'aibot@likemind.com',
      passwordHash: '$2a$12$dummy.hash.for.ai.bot',
      isVerified: true,
      isFirstLogin: false
    });

    await aiBot.save();
    console.log('AI Bot created successfully:', aiBot._id);
    return aiBot;
  } catch (error) {
    console.error('Error creating AI Bot:', error);
  } finally {
    mongoose.disconnect();
  }
};

createAIBot();