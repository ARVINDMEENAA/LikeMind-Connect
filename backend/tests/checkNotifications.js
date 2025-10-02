import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Notification from './models/Notification.js';
dotenv.config();

mongoose.connect('process.env.MONGODB_URI')
  .then(async () => {
    console.log('Connected to MongoDB');
    const notifications = await Notification.find({}).populate('user_id', 'name email');
    console.log('All notifications:', notifications);
    mongoose.disconnect();
  })
  .catch(err => console.error('Error:', err));
