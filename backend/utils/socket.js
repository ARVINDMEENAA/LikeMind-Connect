// Socket.IO utility functions for chat functionality

// Store active users and their socket connections
const activeUsers = new Map();
const userRooms = new Map();

// Helper function to create private room ID
export const createPrivateRoomId = (userId1, userId2) => {
  return [userId1, userId2].sort().join('_');
};

// Get online status of a user
export const isUserOnline = (userId) => {
  return activeUsers.has(userId);
};

// Get all online users
export const getOnlineUsers = () => {
  return Array.from(activeUsers.keys());
};

// Send notification to a specific user
export const sendNotificationToUser = (io, userId, notification) => {
  const socketId = activeUsers.get(userId);
  if (socketId) {
    io.to(`user_${userId}`).emit('notification', notification);
    return true;
  }
  return false;
};

// Send message to private room
export const sendMessageToPrivateRoom = (io, senderId, receiverId, messageData) => {
  const roomId = createPrivateRoomId(senderId, receiverId);
  io.to(roomId).emit('receive_private_message', {
    ...messageData,
    roomId
  });
};

// Main socket event setup function
export const setupSocketEvents = (io) => {
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // User comes online
    socket.on('user_online', (userId) => {
      activeUsers.set(userId, socket.id);
      socket.userId = userId;
      socket.join(`user_${userId}`);
      
      // Notify other users about online status
      socket.broadcast.emit('user_status', { 
        userId, 
        status: 'online',
        timestamp: new Date()
      });
      
      console.log(`User ${userId} is now online`);
    });

    // Join private chat room
    socket.on('join_private_room', ({ userId, otherUserId }) => {
      const roomId = createPrivateRoomId(userId, otherUserId);
      socket.join(roomId);
      
      // Track user's active rooms
      if (!userRooms.has(userId)) {
        userRooms.set(userId, new Set());
      }
      userRooms.get(userId).add(roomId);
      
      console.log(`User ${userId} joined private room: ${roomId}`);
    });

    // Send private message
    socket.on('send_private_message', (data) => {
      const { senderId, receiverId, message, messageType = 'text' } = data;
      const roomId = createPrivateRoomId(senderId, receiverId);
      
      const messageData = {
        senderId,
        receiverId,
        message,
        messageType,
        timestamp: new Date(),
        roomId
      };
      
      // Send to private room
      socket.to(roomId).emit('receive_private_message', messageData);
      
      // Send notification to receiver if not in room
      socket.to(`user_${receiverId}`).emit('new_message_notification', {
        senderId,
        message: messageType === 'text' ? message : `Sent a ${messageType}`,
        timestamp: messageData.timestamp
      });
    });

    // Typing indicators
    socket.on('typing_start', ({ senderId, receiverId }) => {
      const roomId = createPrivateRoomId(senderId, receiverId);
      socket.to(roomId).emit('user_typing', { userId: senderId, isTyping: true });
    });

    socket.on('typing_stop', ({ senderId, receiverId }) => {
      const roomId = createPrivateRoomId(senderId, receiverId);
      socket.to(roomId).emit('user_typing', { userId: senderId, isTyping: false });
    });

    // Message read receipts
    socket.on('message_read', ({ senderId, receiverId, messageId }) => {
      const roomId = createPrivateRoomId(senderId, receiverId);
      socket.to(roomId).emit('message_read_receipt', { 
        messageId, 
        readBy: receiverId,
        timestamp: new Date()
      });
    });

    // Leave private room
    socket.on('leave_private_room', ({ userId, otherUserId }) => {
      const roomId = createPrivateRoomId(userId, otherUserId);
      socket.leave(roomId);
      
      // Remove from user's active rooms
      if (userRooms.has(userId)) {
        userRooms.get(userId).delete(roomId);
      }
      
      console.log(`User ${userId} left private room: ${roomId}`);
    });

    // Get online users
    socket.on('get_online_users', () => {
      socket.emit('online_users', getOnlineUsers());
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      if (socket.userId) {
        activeUsers.delete(socket.userId);
        userRooms.delete(socket.userId);
        
        // Notify other users about offline status
        socket.broadcast.emit('user_status', { 
          userId: socket.userId, 
          status: 'offline',
          lastSeen: new Date()
        });
        
        console.log(`User ${socket.userId} disconnected`);
      }
    });
  });
};