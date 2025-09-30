import mongoose from 'mongoose';
import User from './models/User.js';
import Follow from './models/Follow.js';
import Notification from './models/Notification.js';

mongoose.connect('mongodb://localhost:27017/likemind-connect')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // Get A Gupta and J Gupta users
    const aGupta = await User.findOne({ email: 'agupta@gmail.com' });
    const jGupta = await User.findOne({ email: 'jgupta@gmail.com' });
    
    if (!aGupta || !jGupta) {
      console.log('Users not found');
      return;
    }
    
    console.log('Found users:', { aGupta: aGupta.name, jGupta: jGupta.name });
    
    // Create follow request from A Gupta to J Gupta
    const existingFollow = await Follow.findOne({
      follower: aGupta._id,
      following: jGupta._id
    });
    
    if (!existingFollow) {
      const follow = new Follow({
        follower: aGupta._id,
        following: jGupta._id,
        status: 'pending'
      });
      
      await follow.save();
      console.log('Created follow request from A Gupta to J Gupta');
      
      // Create notification for J Gupta
      const notification = new Notification({
        user_id: jGupta._id,
        type: 'chat_request',
        message: `${aGupta.name} sent you a follow request`
      });
      
      await notification.save();
      console.log('Created notification for J Gupta');
    } else {
      console.log('Follow request already exists');
    }
    
    // Check final state
    const follows = await Follow.find({}).populate('follower following', 'name email');
    const notifications = await Notification.find({}).populate('user_id', 'name email');
    
    console.log('Final follow requests:', follows);
    console.log('Final notifications:', notifications);
    
    mongoose.disconnect();
  })
  .catch(err => console.error('Error:', err));