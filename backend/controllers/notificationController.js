import Notification from '../models/Notification.js';

export const getNotifications = async (req, res) => {
  try {
    const userId = req.user.userId;
    const notifications = await Notification.find({ user_id: userId })
      .populate('follower_id', 'name fullName age location occupation bio hobbies profile_picture')
      .sort({ timestamp: -1 });
    
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const markAsRead = async (req, res) => {
  try {
    const { id, notificationId } = req.body;
    const userId = req.user.userId;
    
    const notificationIdToUpdate = id || notificationId;

    await Notification.findOneAndUpdate(
      { _id: notificationIdToUpdate, user_id: userId },
      { read_status: true }
    );

    // Get updated notification count
    const notificationCount = await Notification.countDocuments({ user_id: userId, read_status: false });
    
    // Emit dashboard update
    const io = req.app.get('io');
    io.to(`user_${userId}`).emit('dashboard_update', {
      notifications: notificationCount
    });

    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.userId;
    const count = await Notification.countDocuments({
      user_id: userId,
      read_status: { $ne: true }
    });
    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    
    await Notification.findOneAndDelete({
      _id: id,
      user_id: userId
    });

    // Get updated notification count
    const notificationCount = await Notification.countDocuments({ user_id: userId, read_status: false });
    
    // Emit dashboard update
    const io = req.app.get('io');
    io.to(`user_${userId}`).emit('dashboard_update', {
      notifications: notificationCount
    });

    res.json({ message: 'Notification deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const followBackFromNotification = async (req, res) => {
  try {
    const { notificationId, followerId } = req.body;
    const userId = req.user.userId;
    
    // Import Follow model
    const Follow = (await import('../models/Follow.js')).default;
    const User = (await import('../models/User.js')).default;
    
    // Check if already following
    const existingFollow = await Follow.findOne({
      follower: userId,
      following: followerId
    });
    
    if (existingFollow) {
      return res.status(400).json({ message: 'Already following this user' });
    }
    
    // Create follow request
    const follow = new Follow({
      follower: userId,
      following: followerId
    });
    
    await follow.save();
    
    // Create notification for the original follower
    const user = await User.findById(userId);
    await new Notification({
      user_id: followerId,
      type: 'chat_request',
      message: `${user.name} followed you back!`,
      follower_id: userId
    }).save();
    
    // Mark original notification as read
    await Notification.findByIdAndUpdate(notificationId, { read_status: true });
    
    res.json({ message: 'Follow back sent successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const ignoreNotification = async (req, res) => {
  try {
    const { notificationId } = req.body;
    const userId = req.user.userId;
    
    // Simply mark as read and delete
    await Notification.findOneAndDelete({
      _id: notificationId,
      user_id: userId
    });
    
    res.json({ message: 'Notification ignored' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};