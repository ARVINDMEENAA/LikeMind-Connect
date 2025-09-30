import mongoose from 'mongoose';
import Notification from './models/Notification.js';

mongoose.connect('mongodb://localhost:27017/likemind-connect')
  .then(async () => {
    console.log('Connected to MongoDB');
    const notifications = await Notification.find({}).populate('user_id', 'name email');
    console.log('All notifications:', notifications);
    mongoose.disconnect();
  })
  .catch(err => console.error('Error:', err));