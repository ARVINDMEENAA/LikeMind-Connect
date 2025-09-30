import mongoose from 'mongoose';
import Follow from './models/Follow.js';
import Notification from './models/Notification.js';
import User from './models/User.js';
import dotenv from 'dotenv';

dotenv.config();

const debugDashboard = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/likemind');
    console.log('Connected to MongoDB');

    // Get all users
    const users = await User.find({}).select('name email');
    console.log('\n=== USERS ===');
    users.forEach(u => console.log(`${u.name} (${u._id})`));

    // Get all follow requests
    const follows = await Follow.find({}).populate('follower following', 'name email');
    console.log('\n=== FOLLOW REQUESTS ===');
    console.log('Total follows:', follows.length);
    follows.forEach(f => {
      console.log(`${f.follower?.name || 'Unknown'} -> ${f.following?.name || 'Unknown'} : ${f.status}`);
    });

    // Get all notifications
    const notifications = await Notification.find({}).populate('user_id', 'name');
    console.log('\n=== NOTIFICATIONS ===');
    console.log('Total notifications:', notifications.length);
    notifications.forEach(n => {
      console.log(`${n.user_id?.name || 'Unknown'}: ${n.type} - ${n.message} (Read: ${n.read_status})`);
    });

    // Test dashboard stats for first user
    if (users.length > 0) {
      const testUserId = users[0]._id;
      console.log(`\n=== DASHBOARD STATS FOR ${users[0].name} ===`);
      
      const pendingCount = await Follow.countDocuments({ following: testUserId, status: 'pending' });
      const notificationCount = await Notification.countDocuments({ user_id: testUserId, read_status: false });
      const connectionCount = await Follow.countDocuments({ following: testUserId, status: 'accepted' });
      
      console.log('Pending requests:', pendingCount);
      console.log('Unread notifications:', notificationCount);
      console.log('Connections:', connectionCount);
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

debugDashboard();