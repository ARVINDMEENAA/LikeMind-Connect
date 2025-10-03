import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file from backend directory
dotenv.config({ path: path.join(__dirname, '.env') });

// Debug: Check if env vars are loaded
console.log('🔧 Environment Variables Status:', {
  MONGODB_URI: process.env.MONGODB_URI ? '✅ Set' : '❌ Missing',
  FRONTEND_URL: process.env.FRONTEND_URL ? '✅ Set' : '❌ Missing',
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME ? '✅ Set' : '❌ Missing',
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY ? '✅ Set' : '❌ Missing',
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET ? '✅ Set' : '❌ Missing'
});

// Additional debug for Cloudinary values
console.log('🔧 Cloudinary Values Debug:', {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET ? '[HIDDEN]' : 'Missing'
});

const app = express();
app.set('trust proxy', 1);

// --------- CORS FIX (HINGLISH: YAHI LAGANA HAI, BAS) ----------
import cors from 'cors';

// SABSE UPPAR, SIRF EK LINE, KOI ARRAY YA CALLBACK NAHI!
app.use(cors({
  origin: 'https://likemindconnect.netlify.app',
  credentials: true
}));
// --------------------------------------------------------------

// Baaki middleware/routes niche hi rakho

const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'https://likemindconnect.netlify.app',
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Security middleware - HTTPS enforcement
app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'production' && req.header('x-forwarded-proto') !== 'https') {
    return res.redirect(`https://${req.header('host')}${req.url}`);
  }

  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  next();
});

// Middleware
app.use(cookieParser());
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));
app.use('/uploads', express.static('uploads'));

// Server timeout (large uploads)
server.timeout = 300000; // 5 minutes

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`, req.body);
  next();
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend is working!' });
});

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/likemind-connect', {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  maxPoolSize: 10
})
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Import routes
import authRoutes from './routes/authRoutes.js';
import profileRoutes from './routes/profileRoutes.js';
import matchRoutes from './routes/matchRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';
import hobbyRoutes from './routes/hobbyRoutes.js';
import followRoutes from './routes/followRoutes.js';
import blockRoutes from './routes/blockRoutes.js';
import uploadRoutes from './routes/upload.js';
import testUploadRoutes from './routes/testUpload.js';

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api', profileRoutes);
app.use('/api', matchRoutes);
app.use('/api', chatRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/hobby', hobbyRoutes);
app.use('/api', followRoutes);
app.use('/api', blockRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api', testUploadRoutes);

// Socket.io setup
app.set('io', io);

const activeUsers = new Map();
const createPrivateRoomId = (userId1, userId2) => [userId1, userId2].sort().join('_');

io.on('connection', (socket) => {
  socket.on('user_online', (userId) => {
    activeUsers.set(userId, socket.id);
    socket.userId = userId;
    socket.join(`user_${userId}`);
    console.log(`User ${userId} is online`);
    socket.broadcast.emit('user_status', { userId, status: 'online' });
  });

  socket.on('join_private_room', ({ userId, otherUserId }) => {
    const roomId = createPrivateRoomId(userId, otherUserId);
    socket.join(roomId);
    console.log(`User ${userId} joined private room: ${roomId}`);
    socket.to(roomId).emit('user_joined_room', { userId, roomId });
  });

  socket.on('send_private_message', (data) => {
    const { senderId, receiverId, message, messageType = 'text', timestamp } = data;
    const roomId = createPrivateRoomId(senderId, receiverId);

    const messageData = {
      senderId,
      receiverId,
      message,
      messageType,
      timestamp: timestamp || new Date(),
      roomId
    };

    socket.to(roomId).emit('receive_private_message', messageData);
    socket.to(`user_${receiverId}`).emit('new_message_notification', {
      senderId,
      message: messageType === 'text' ? message : `Sent a ${messageType}`,
      timestamp: messageData.timestamp
    });

    console.log(`Message sent from ${senderId} to ${receiverId} in room ${roomId}`);
  });

  socket.on('typing_start', ({ senderId, receiverId }) => {
    const roomId = createPrivateRoomId(senderId, receiverId);
    socket.to(roomId).emit('user_typing', { userId: senderId, isTyping: true });
  });

  socket.on('typing_stop', ({ senderId, receiverId }) => {
    const roomId = createPrivateRoomId(senderId, receiverId);
    socket.to(roomId).emit('user_typing', { userId: senderId, isTyping: false });
  });

  socket.on('message_read', ({ senderId, receiverId, messageId }) => {
    const roomId = createPrivateRoomId(senderId, receiverId);
    socket.to(roomId).emit('message_read_receipt', { messageId, readBy: receiverId });
  });

  socket.on('leave_private_room', ({ userId, otherUserId }) => {
    const roomId = createPrivateRoomId(userId, otherUserId);
    socket.leave(roomId);
    console.log(`User ${userId} left private room: ${roomId}`);
  });

  socket.on('disconnect', () => {
    if (socket.userId) {
      activeUsers.delete(socket.userId);
      socket.broadcast.emit('user_status', { 
        userId: socket.userId, 
        status: 'offline',
        lastSeen: new Date()
      });
      console.log(`User ${socket.userId} disconnected`);
    }
  });

  socket.on('get_online_users', () => {
    socket.emit('online_users', Array.from(activeUsers.keys()));
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔌 Socket.IO server ready for connections`);
});
