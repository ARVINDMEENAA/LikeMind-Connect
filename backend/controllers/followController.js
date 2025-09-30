import Follow from '../models/Follow.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import Block from '../models/Block.js';

export const sendFollowRequest = async (req, res) => {
  try {
    const { userId } = req.body;
    const followerId = req.user.userId;

    if (followerId === userId) {
      return res.status(400).json({ message: 'Cannot follow yourself' });
    }

    // Check both follow and notification in single query to prevent race conditions
    const [existingFollow, existingNotification] = await Promise.all([
      Follow.findOne({ follower: followerId, following: userId }),
      Notification.findOne({ user_id: userId, follower_id: followerId, type: 'chat_request' })
    ]);

    if (existingFollow || existingNotification) {
      return res.status(400).json({ message: 'Follow request already exists' });
    }

    // Create both follow and notification atomically
    const follower = await User.findById(followerId);
    
    const [follow] = await Promise.all([
      new Follow({ follower: followerId, following: userId }).save(),
      new Notification({
        user_id: userId,
        type: 'chat_request',
        message: `${follower.name} sent you a follow request`,
        follower_id: followerId
      }).save()
    ]);

    // Get updated counts
    const pendingCount = await Follow.countDocuments({ following: userId, status: 'pending' });
    const notificationCount = await Notification.countDocuments({ user_id: userId, read_status: false });

    // Emit socket event with updated counts
    const io = req.app.get('io');
    io.to(`user_${userId}`).emit('dashboard_update', {
      pendingRequests: pendingCount,
      notifications: notificationCount
    });

    res.json({ message: 'Follow request sent' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const acceptFollowRequest = async (req, res) => {
  try {
    const { followerId } = req.body;
    const userId = req.user.userId;
    
    console.log('Accept request - followerId:', followerId, 'userId:', userId);

    const follow = await Follow.findOneAndUpdate(
      { follower: followerId, following: userId, status: 'pending' },
      { status: 'accepted' },
      { new: true }
    );
    
    console.log('Found follow record:', follow);

    if (!follow) {
      return res.status(404).json({ message: 'Follow request not found' });
    }

    // Remove related notification
    const deletedNotification = await Notification.findOneAndDelete({
      user_id: userId,
      follower_id: followerId,
      type: 'chat_request'
    });
    
    console.log('Deleted notification:', deletedNotification);

    // Create acceptance notification for follower
    const user = await User.findById(userId);
    await new Notification({
      user_id: followerId,
      type: 'follow_accepted',
      message: `${user.name} accepted your follow request`
    }).save();

    // Get updated counts for both users
    const userBPendingCount = await Follow.countDocuments({ following: userId, status: 'pending' });
    const userBNotificationCount = await Notification.countDocuments({ user_id: userId, read_status: false });
    const userANotificationCount = await Notification.countDocuments({ user_id: followerId, read_status: false });

    // Get mutual connections for both users
    const getUserMutualConnections = async (uid) => {
      const following = await Follow.find({ follower: uid, status: 'accepted' }).select('following');
      const followers = await Follow.find({ following: uid, status: 'accepted' }).select('follower');
      const followingIds = following.map(f => f.following.toString());
      const followerIds = followers.map(f => f.follower.toString());
      const mutualIds = followingIds.filter(id => followerIds.includes(id));
      return await User.find({ _id: { $in: mutualIds } })
        .select('name fullName age location occupation bio hobbies avatar profile_picture');
    };
    
    const userBMutualConnections = await getUserMutualConnections(userId);
    const userAMutualConnections = await getUserMutualConnections(followerId);

    // Emit socket events
    const io = req.app.get('io');
    
    // Update User B (accepter)
    io.to(`user_${userId}`).emit('dashboard_update', {
      pendingRequests: userBPendingCount,
      notifications: userBNotificationCount,
      connections: {
        count: userBMutualConnections.length,
        list: userBMutualConnections
      }
    });

    // Update User A (requester)
    io.to(`user_${followerId}`).emit('dashboard_update', {
      notifications: userANotificationCount,
      connections: {
        count: userAMutualConnections.length,
        list: userAMutualConnections
      }
    });

    res.json({ message: 'Follow request accepted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const rejectFollowRequest = async (req, res) => {
  try {
    const { followerId } = req.body;
    const userId = req.user.userId;

    // Delete follow record completely so user can send request again
    await Follow.findOneAndDelete({
      follower: followerId,
      following: userId,
      status: 'pending'
    });

    // Remove related notification
    await Notification.findOneAndDelete({
      user_id: userId,
      follower_id: followerId,
      type: 'chat_request'
    });

    // Get updated counts
    const pendingCount = await Follow.countDocuments({ following: userId, status: 'pending' });
    const notificationCount = await Notification.countDocuments({ user_id: userId, read_status: false });

    // Emit socket event
    const io = req.app.get('io');
    io.to(`user_${userId}`).emit('dashboard_update', {
      pendingRequests: pendingCount,
      notifications: notificationCount
    });

    res.json({ message: 'Follow request rejected' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getFollowers = async (req, res) => {
  try {
    const { userId } = req.params;
    const targetUserId = userId || req.user.userId;

    const followers = await Follow.find({
      following: targetUserId,
      status: 'accepted'
    }).populate('follower', 'name fullName age location occupation bio hobbies avatar profile_picture');

    res.json(followers.map(f => f.follower));
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getFollowing = async (req, res) => {
  try {
    const { userId } = req.params;
    const targetUserId = userId || req.user.userId;

    const following = await Follow.find({
      follower: targetUserId,
      status: 'accepted'
    }).populate('following', 'name fullName age location occupation bio hobbies avatar profile_picture');

    res.json(following.map(f => f.following));
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getConnections = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Get mutual connections
    const myFollowing = await Follow.find({ follower: userId, status: 'accepted' }).select('following');
    const myFollowers = await Follow.find({ following: userId, status: 'accepted' }).select('follower');
    
    const followingIds = myFollowing.map(f => f.following.toString());
    const followerIds = myFollowers.map(f => f.follower.toString());
    const mutualIds = followingIds.filter(id => followerIds.includes(id));
    
    const mutualConnections = await User.find({ _id: { $in: mutualIds } })
      .select('name fullName age location occupation bio hobbies avatar profile_picture');

    res.json({
      count: mutualConnections.length,
      list: mutualConnections
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getPendingRequests = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const pendingRequests = await Follow.find({
      following: userId,
      status: 'pending'
    }).populate('follower', 'name fullName age location occupation bio hobbies avatar profile_picture');

    res.json({
      count: pendingRequests.length,
      requests: pendingRequests.map(f => f.follower)
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Get all accepted connections (both following and followers)
    const myFollowing = await Follow.find({ follower: userId, status: 'accepted' }).select('following');
    const myFollowers = await Follow.find({ following: userId, status: 'accepted' }).select('follower');
    
    const followingIds = myFollowing.map(f => f.following.toString());
    const followerIds = myFollowers.map(f => f.follower.toString());
    
    // Include both followers and following as connections
    const allConnectionIds = [...new Set([...followingIds, ...followerIds])];
    
    const [pendingCount, notificationCount, blockedCount] = await Promise.all([
      Follow.countDocuments({ following: userId, status: 'pending' }),
      Notification.countDocuments({ user_id: userId, read_status: false }),
      Block.countDocuments({ blocker: userId })
    ]);
    
    const allConnections = await User.find({ _id: { $in: allConnectionIds } })
      .select('name fullName age location occupation bio hobbies avatar profile_picture');

    res.json({
      pendingRequests: pendingCount,
      notifications: notificationCount,
      connections: {
        count: allConnections.length,
        list: allConnections
      },
      blockedUsers: blockedCount
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getFollowStatus = async (req, res) => {
  try {
    const { userId } = req.query;
    const currentUserId = req.user.userId;

    const followRequest = await Follow.findOne({
      $or: [
        { follower: currentUserId, following: userId },
        { follower: userId, following: currentUserId }
      ]
    });

    let status = 'none';
    if (followRequest) {
      if (followRequest.follower.toString() === currentUserId) {
        status = followRequest.status; // pending, accepted, rejected
      } else {
        status = 'received'; // received a request from this user
      }
    }

    res.json({ status });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const checkMutualFollow = async (userId1, userId2) => {
  const follow1 = await Follow.findOne({
    follower: userId1,
    following: userId2,
    status: 'accepted'
  });

  const follow2 = await Follow.findOne({
    follower: userId2,
    following: userId1,
    status: 'accepted'
  });

  return follow1 && follow2;
};