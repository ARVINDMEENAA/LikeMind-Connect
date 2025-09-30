import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
  }

  // Initialize socket connection
  connect(userId) {
    if (!this.socket) {
      this.socket = io(import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000', {
        transports: ['websocket', 'polling']
      });

      this.socket.on('connect', () => {
        console.log('Connected to server');
        this.isConnected = true;
        
        // Authenticate user
        if (userId) {
          this.socket.emit('user_online', userId);
        }
      });

      this.socket.on('disconnect', () => {
        console.log('Disconnected from server');
        this.isConnected = false;
      });

      this.socket.on('connect_error', (error) => {
        console.error('Connection error:', error);
      });
    }
    
    return this.socket;
  }

  // Disconnect socket
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  // Join private chat room
  joinPrivateRoom(userId, otherUserId) {
    if (this.socket) {
      this.socket.emit('join_private_room', { userId, otherUserId });
    }
  }

  // Leave private chat room
  leavePrivateRoom(userId, otherUserId) {
    if (this.socket) {
      this.socket.emit('leave_private_room', { userId, otherUserId });
    }
  }

  // Send private message
  sendPrivateMessage(senderId, receiverId, message, messageType = 'text') {
    if (this.socket) {
      this.socket.emit('send_private_message', {
        senderId,
        receiverId,
        message,
        messageType,
        timestamp: new Date()
      });
    }
  }

  // Typing indicators
  startTyping(senderId, receiverId) {
    if (this.socket) {
      this.socket.emit('typing_start', { senderId, receiverId });
    }
  }

  stopTyping(senderId, receiverId) {
    if (this.socket) {
      this.socket.emit('typing_stop', { senderId, receiverId });
    }
  }

  // Mark message as read
  markMessageAsRead(senderId, receiverId, messageId) {
    if (this.socket) {
      this.socket.emit('message_read', { senderId, receiverId, messageId });
    }
  }

  // Get online users
  getOnlineUsers() {
    if (this.socket) {
      this.socket.emit('get_online_users');
    }
  }

  // Event listeners
  onReceiveMessage(callback) {
    if (this.socket) {
      this.socket.on('receive_private_message', callback);
    }
  }

  onUserTyping(callback) {
    if (this.socket) {
      this.socket.on('user_typing', callback);
    }
  }

  onMessageRead(callback) {
    if (this.socket) {
      this.socket.on('message_read_receipt', callback);
    }
  }

  onUserStatus(callback) {
    if (this.socket) {
      this.socket.on('user_status', callback);
    }
  }

  onNewMessageNotification(callback) {
    if (this.socket) {
      this.socket.on('new_message_notification', callback);
    }
  }

  onOnlineUsers(callback) {
    if (this.socket) {
      this.socket.on('online_users', callback);
    }
  }

  onUserJoinedRoom(callback) {
    if (this.socket) {
      this.socket.on('user_joined_room', callback);
    }
  }

  // Dashboard updates
  onDashboardUpdate(callback) {
    if (this.socket) {
      this.socket.on('dashboard_update', callback);
    }
  }

  // Remove event listeners
  removeListener(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  removeAllListeners() {
    if (this.socket) {
      this.socket.removeAllListeners();
    }
  }
}

// Create singleton instance
const socketService = new SocketService();
export default socketService;