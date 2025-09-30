import Block from '../models/Block.js';
import User from '../models/User.js';
import Follow from '../models/Follow.js';
import Notification from '../models/Notification.js';

export const blockUser = async (req, res) => {
  try {
    const { userId } = req.body;
    const blockerId = req.user.userId;

    if (blockerId === userId) {
      return res.status(400).json({ message: 'Cannot block yourself' });
    }

    const existingBlock = await Block.findOne({
      blocker: blockerId,
      blocked: userId
    });

    if (existingBlock) {
      return res.status(400).json({ message: 'User already blocked' });
    }

    await new Block({
      blocker: blockerId,
      blocked: userId
    }).save();

    // Remove any follow relationships
    await Follow.deleteMany({
      $or: [
        { follower: blockerId, following: userId },
        { follower: userId, following: blockerId }
      ]
    });

    // Remove related notifications
    await Notification.deleteMany({
      $or: [
        { user_id: blockerId, follower_id: userId },
        { user_id: userId, follower_id: blockerId }
      ]
    });

    res.json({ message: 'User blocked successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const unblockUser = async (req, res) => {
  try {
    const { userId } = req.body;
    const blockerId = req.user.userId;

    await Block.findOneAndDelete({
      blocker: blockerId,
      blocked: userId
    });

    res.json({ message: 'User unblocked successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getBlockedUsers = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const blockedUsers = await Block.find({ blocker: userId })
      .populate('blocked', 'name fullName age location occupation bio hobbies avatar profile_picture');

    res.json({
      count: blockedUsers.length,
      list: blockedUsers.map(block => block.blocked)
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};