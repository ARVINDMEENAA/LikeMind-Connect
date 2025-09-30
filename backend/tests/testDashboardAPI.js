import mongoose from 'mongoose';
import Follow from './models/Follow.js';
import Notification from './models/Notification.js';
import User from './models/User.js';
import dotenv from 'dotenv';

dotenv.config();

const testDashboardAPI = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/likemind');
    
    // Get a user who has pending requests
    const userWithRequests = await User.findOne({ name: 'A gupta' });
    if (!userWithRequests) {
      console.log('No test user found');
      return;
    }
    
    console.log(`Testing dashboard for: ${userWithRequests.name} (${userWithRequests._id})`);
    
    // Test the exact same queries as in controller
    const pendingCount = await Follow.countDocuments({ 
      following: userWithRequests._id, 
      status: 'pending' 
    });
    
    const notificationCount = await Notification.countDocuments({ 
      user_id: userWithRequests._id, 
      read_status: false 
    });
    
    const connectionCount = await Follow.countDocuments({ 
      following: userWithRequests._id, 
      status: 'accepted' 
    });
    
    const connections = await Follow.find({ 
      following: userWithRequests._id, 
      status: 'accepted' 
    }).populate('follower', 'name fullName avatar hobbies bio location');
    
    console.log('\n=== DASHBOARD STATS ===');
    console.log('Pending requests:', pendingCount);
    console.log('Unread notifications:', notificationCount);
    console.log('Connections:', connectionCount);
    console.log('Connection list:', connections.map(c => c.follower?.name));
    
    // Check pending requests details
    const pendingRequests = await Follow.find({
      following: userWithRequests._id,
      status: 'pending'
    }).populate('follower', 'name fullName avatar');
    
    console.log('\n=== PENDING REQUESTS DETAILS ===');
    pendingRequests.forEach(req => {
      console.log(`From: ${req.follower?.name} (${req.follower?._id})`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

testDashboardAPI();