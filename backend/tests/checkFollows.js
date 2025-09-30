import mongoose from 'mongoose';
import Follow from './models/Follow.js';

mongoose.connect('mongodb://localhost:27017/likemind-connect')
  .then(async () => {
    console.log('Connected to MongoDB');
    const follows = await Follow.find({}).populate('follower following', 'name email');
    console.log('All follow requests:', follows);
    mongoose.disconnect();
  })
  .catch(err => console.error('Error:', err));