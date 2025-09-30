import mongoose from 'mongoose';
import User from '../models/User.js';
import Chat from '../models/Chat.js';
import Message from '../models/Message.js';
import Match from '../models/Match.js';
import Follow from '../models/Follow.js';
import Block from '../models/Block.js';
import Notification from '../models/Notification.js';
import dotenv from 'dotenv';

dotenv.config();

const cleanupAllData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get counts before deletion
    const userCount = await User.countDocuments();
    const chatCount = await Chat.countDocuments();
    const messageCount = await Message.countDocuments();
    const matchCount = await Match.countDocuments();
    const followCount = await Follow.countDocuments();
    const blockCount = await Block.countDocuments();
    const notificationCount = await Notification.countDocuments();

    console.log('\n=== BEFORE CLEANUP ===');
    console.log(`Users: ${userCount}`);
    console.log(`Chats: ${chatCount}`);
    console.log(`Messages: ${messageCount}`);
    console.log(`Matches: ${matchCount}`);
    console.log(`Follows: ${followCount}`);
    console.log(`Blocks: ${blockCount}`);
    console.log(`Notifications: ${notificationCount}`);

    // Delete all data
    await User.deleteMany({});
    await Chat.deleteMany({});
    await Message.deleteMany({});
    await Match.deleteMany({});
    await Follow.deleteMany({});
    await Block.deleteMany({});
    await Notification.deleteMany({});

    console.log('\n=== CLEANUP COMPLETED ===');
    console.log('All user data has been deleted successfully');

  } catch (error) {
    console.error('Error during cleanup:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

cleanupAllData();