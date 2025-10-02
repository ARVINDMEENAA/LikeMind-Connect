import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Follow from './models/Follow.js';
dotenv.config();

mongoose.connect('process.env.MONGODB_URI')
  .then(async () => {
    console.log('Connected to MongoDB');
    const follows = await Follow.find({}).populate('follower following', 'name email');
    console.log('All follow requests:', follows);
    mongoose.disconnect();
  })
  .catch(err => console.error('Error:', err));
