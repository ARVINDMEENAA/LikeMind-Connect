import Message from '../models/Message.js';
import Chat from '../models/Chat.js';
import User from '../models/User.js';
import Follow from '../models/Follow.js';
import { checkMutualFollow } from './followController.js';
import { upload } from '../config/cloudinary.js';
import { generateAIResponse } from '../services/geminiService.js';

export const getChatWithUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.userId;
    
    // Skip connection check for AI Assistant
    if (userId !== 'ai-assistant') {
      // Check if users have any accepted follow relationship
      const hasConnection = await Follow.findOne({
        $or: [
          { follower: currentUserId, following: userId, status: 'accepted' },
          { follower: userId, following: currentUserId, status: 'accepted' }
        ]
      });
      
      if (!hasConnection) {
        return res.status(403).json({ message: 'Chat only available for connected users' });
      }
    }

    // For AI Assistant, return empty messages array since it doesn't store chat history
    if (userId === 'ai-assistant') {
      return res.json([]);
    }

    const messages = await Message.find({
      $or: [
        { from_user_id: currentUserId, to_user_id: userId },
        { from_user_id: userId, to_user_id: currentUserId }
      ],
      deleted_for: { $ne: currentUserId } // Exclude messages deleted by current user
    }).sort({ timestamp: 1 }).populate('from_user_id', 'name avatar');

    // Format messages with proper timestamps
    const formattedMessages = messages.map(msg => ({
      ...msg.toObject(),
      timestamp: new Date(msg.timestamp).toISOString()
    }));

    res.json(formattedMessages);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const sendMessage = async (req, res) => {
  try {
    console.log('📨 SendMessage - Headers:', req.headers['content-type']);
    console.log('📨 SendMessage - Request body:', req.body);
    console.log('📨 SendMessage - File:', req.file);
    console.log('📨 SendMessage - Files:', req.files);
    console.log('📨 SendMessage - Route path:', req.route?.path);
    console.log('📨 SendMessage - URL:', req.url);
    
    const { message, receiverId, messageType = 'text' } = req.body;
    const senderId = req.user.userId;

    console.log('📨 SendMessage - Sender:', senderId, 'Receiver:', receiverId);

    // Check if users have any accepted follow relationship
    const hasConnection = await Follow.findOne({
      $or: [
        { follower: senderId, following: receiverId, status: 'accepted' },
        { follower: receiverId, following: senderId, status: 'accepted' }
      ]
    });
    
    if (!hasConnection) {
      console.log('❌ No connection found between users');
      return res.status(403).json({ message: 'Chat only available for connected users' });
    }

    let messageData = {
      from_user_id: senderId,
      to_user_id: receiverId,
      message_text: message,
      message_type: messageType,
      timestamp: new Date()
    };

    // Handle file upload
    if (req.file) {
      console.log('📎 File upload detected:', req.file);
      messageData.file_url = req.file.path; // CloudinaryStorage provides path as the URL
      messageData.file_name = req.file.originalname;
      messageData.file_size = req.file.size;
      messageData.message_type = getFileType(req.file.mimetype);
      messageData.message_text = req.file.originalname;
      messageData.public_id = req.file.filename; // CloudinaryStorage provides filename as public_id
    }

    console.log('💾 Saving message to database:', messageData);
    const newMessage = new Message(messageData);
    await newMessage.save();
    console.log('✅ Message saved successfully:', newMessage._id);
    
    const sender = await User.findById(senderId, 'name avatar');
    console.log('👤 Sender found:', sender?.name);
    
    const responseData = {
      success: true, 
      message: 'Message sent successfully',
      data: {
        _id: newMessage._id,
        from_user_id: { _id: senderId, name: sender.name },
        message_text: messageData.message_text,
        message_type: messageData.message_type,
        file_url: messageData.file_url,
        file_name: messageData.file_name,
        timestamp: newMessage.timestamp
      }
    };
    
    console.log('📤 Sending response:', responseData);
    res.json(responseData);
  } catch (error) {
    console.error('❌ SendMessage Error:', error);
    
    // Handle aborted requests
    if (error.code === 'ECONNABORTED' || error.message.includes('aborted')) {
      console.log('⚠️ Request was aborted by client');
      return; // Don't send response for aborted requests
    }
    
    console.error('❌ Error stack:', error.stack);
    console.error('❌ Request details:', {
      body: req.body,
      file: req.file,
      headers: req.headers
    });
    
    if (!res.headersSent) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
};

const getFileType = (mimetype) => {
  console.log('📋 Determining file type for:', mimetype);
  if (mimetype.startsWith('image/')) return 'image';
  if (mimetype.startsWith('video/')) return 'video';
  if (mimetype.startsWith('audio/')) return 'audio';
  if (mimetype.includes('pdf') || 
      mimetype.includes('document') || 
      mimetype.includes('word') || 
      mimetype.includes('excel') || 
      mimetype.includes('powerpoint') || 
      mimetype.includes('text/') ||
      mimetype.includes('csv')) return 'document';
  return 'file';
};

export const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { deleteFor } = req.body; // 'me' or 'everyone'
    const userId = req.user.userId;
    
    const message = await Message.findById(messageId);
    
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }
    
    // Check if user can delete this message
    if (message.from_user_id.toString() !== userId && deleteFor === 'everyone') {
      return res.status(403).json({ message: 'Can only delete for everyone if you sent the message' });
    }
    
    if (deleteFor === 'everyone') {
      // Delete for everyone - remove message completely
      if (message.public_id) {
        // Delete file from Cloudinary
        try {
          const cloudinary = (await import('../config/cloudinary.js')).default;
          await cloudinary.uploader.destroy(message.public_id);
        } catch (error) {
          console.error('Error deleting file from Cloudinary:', error);
        }
      }
      await Message.findByIdAndDelete(messageId);
      
      // Emit socket event to remove message for all users
      const io = req.app.get('io');
      const createPrivateRoomId = (userId1, userId2) => {
        return [userId1, userId2].sort().join('_');
      };
      const roomId = createPrivateRoomId(message.from_user_id, message.to_user_id);
      io.to(roomId).emit('message_deleted_everyone', { messageId });
      
    } else {
      // Delete for me only
      await Message.findByIdAndUpdate(messageId, {
        $addToSet: { deleted_for: userId }
      });
    }
    
    res.json({ success: true, message: 'Message deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const editMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { newText } = req.body;
    const userId = req.user.userId;
    
    const message = await Message.findOne({ 
      _id: messageId, 
      from_user_id: userId 
    });
    
    if (!message) {
      return res.status(404).json({ message: 'Message not found or unauthorized' });
    }
    
    // Store original text if not already stored
    if (!message.original_text) {
      message.original_text = message.message_text;
    }
    
    message.message_text = newText;
    message.edited = true;
    await message.save();
    
    // Emit socket event
    const io = req.app.get('io');
    const createPrivateRoomId = (userId1, userId2) => {
      return [userId1, userId2].sort().join('_');
    };
    const roomId = createPrivateRoomId(message.from_user_id, message.to_user_id);
    io.to(roomId).emit('message_edited', { 
      messageId, 
      newText, 
      edited: true 
    });
    
    res.json({ success: true, message: 'Message edited successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getUserChats = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Get all messages where user is sender or receiver
    const messages = await Message.find({
      $or: [
        { from_user_id: userId },
        { to_user_id: userId }
      ]
    }).populate('from_user_id to_user_id', 'name avatar profile_picture')
      .sort({ timestamp: -1 });

    // Group by chat partner
    const chats = {};
    messages.forEach(msg => {
      const partnerId = msg.from_user_id._id.toString() === userId ? 
        msg.to_user_id._id.toString() : msg.from_user_id._id.toString();
      
      if (!chats[partnerId]) {
        chats[partnerId] = {
          partner: msg.from_user_id._id.toString() === userId ? msg.to_user_id : msg.from_user_id,
          lastMessage: msg.message_text,
          lastMessageTime: msg.timestamp,
          unreadCount: 0
        };
      }
    });

    // Calculate unread count for each chat
    for (const partnerId in chats) {
      const unreadCount = await Message.countDocuments({
        from_user_id: partnerId,
        to_user_id: userId,
        read: false
      });
      chats[partnerId].unreadCount = unreadCount;
    }

    res.json(Object.values(chats));
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.userId;
    const count = await Message.countDocuments({
      to_user_id: userId,
      read: false
    });
    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getChatUnreadCount = async (req, res) => {
  try {
    const { partnerId } = req.params;
    const userId = req.user.userId;
    
    const count = await Message.countDocuments({
      from_user_id: partnerId,
      to_user_id: userId,
      read: false
    });
    
    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const markMessagesAsRead = async (req, res) => {
  try {
    const { senderId } = req.body;
    const userId = req.user.userId;
    
    await Message.updateMany(
      { from_user_id: senderId, to_user_id: userId, read: false },
      { read: true }
    );
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const deleteEntireChat = async (req, res) => {
  try {
    const { userId: otherUserId } = req.params;
    const currentUserId = req.user.userId;
    
    // Delete all messages between these two users
    await Message.deleteMany({
      $or: [
        { from_user_id: currentUserId, to_user_id: otherUserId },
        { from_user_id: otherUserId, to_user_id: currentUserId }
      ]
    });
    
    res.json({ success: true, message: 'Chat deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const bulkDeleteMessages = async (req, res) => {
  try {
    const { messageIds, deleteFor } = req.body; // messageIds array, deleteFor: 'me' or 'everyone'
    const userId = req.user.userId;
    
    if (!messageIds || !Array.isArray(messageIds) || messageIds.length === 0) {
      return res.status(400).json({ message: 'Message IDs array is required' });
    }
    
    const messages = await Message.find({ _id: { $in: messageIds } });
    
    if (messages.length === 0) {
      return res.status(404).json({ message: 'No messages found' });
    }
    
    let deletedCount = 0;
    const roomIds = new Set();
    
    for (const message of messages) {
      // Check if user can delete this message
      if (deleteFor === 'everyone' && message.from_user_id.toString() !== userId) {
        continue; // Skip messages user didn't send when deleting for everyone
      }
      
      if (deleteFor === 'everyone') {
        // Delete for everyone - remove message completely
        if (message.public_id) {
          try {
            const cloudinary = (await import('../config/cloudinary.js')).default;
            await cloudinary.uploader.destroy(message.public_id);
          } catch (error) {
            console.error('Error deleting file from Cloudinary:', error);
          }
        }
        await Message.findByIdAndDelete(message._id);
        
        // Track room for socket emission
        const createPrivateRoomId = (userId1, userId2) => {
          return [userId1, userId2].sort().join('_');
        };
        const roomId = createPrivateRoomId(message.from_user_id, message.to_user_id);
        roomIds.add(roomId);
        
      } else {
        // Delete for me only
        await Message.findByIdAndUpdate(message._id, {
          $addToSet: { deleted_for: userId }
        });
      }
      
      deletedCount++;
    }
    
    // Emit socket events for deleted messages
    if (deleteFor === 'everyone' && roomIds.size > 0) {
      const io = req.app.get('io');
      roomIds.forEach(roomId => {
        io.to(roomId).emit('messages_bulk_deleted', { messageIds });
      });
    }
    
    res.json({ 
      success: true, 
      message: `${deletedCount} messages deleted successfully`,
      deletedCount 
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const generateAIMessage = async (req, res) => {
  try {
    const { prompt, receiverId } = req.body;
    const senderId = req.user.userId;

    console.log('🤖 AI Request:', { prompt, receiverId, senderId });

    // Skip connection check for AI Assistant
    if (receiverId !== 'ai-assistant') {
      const hasConnection = await Follow.findOne({
        $or: [
          { follower: senderId, following: receiverId, status: 'accepted' },
          { follower: receiverId, following: senderId, status: 'accepted' }
        ]
      });
      
      if (!hasConnection) {
        return res.status(403).json({ message: 'Chat only available for connected users' });
      }
    }

    // Generate AI response
    console.log('🤖 Calling Gemini API...');
    const aiResponse = await generateAIResponse(prompt);
    console.log('🤖 AI Response:', aiResponse);
    
    // For AI Assistant, don't save to database, just return response
    if (receiverId === 'ai-assistant') {
      return res.json({
        success: true,
        message: 'AI response generated',
        data: {
          _id: `ai_${Date.now()}`,
          from_user_id: { _id: 'ai-assistant', name: '🤖 AI Assistant' },
          message_text: aiResponse,
          message_type: 'ai',
          timestamp: new Date().toISOString()
        }
      });
    }
    
    // For regular users, save AI message
    const messageData = {
      from_user_id: senderId,
      to_user_id: receiverId,
      message_text: aiResponse,
      message_type: 'ai',
      timestamp: new Date()
    };

    const newMessage = new Message(messageData);
    await newMessage.save();
    
    const sender = await User.findById(senderId, 'name avatar');
    
    res.json({
      success: true,
      message: 'AI response generated',
      data: {
        _id: newMessage._id,
        from_user_id: { _id: senderId, name: sender.name },
        message_text: messageData.message_text,
        message_type: 'ai',
        timestamp: newMessage.timestamp
      }
    });
  } catch (error) {
    console.error('🤖 AI Error:', error);
    res.status(500).json({ message: 'AI generation failed', error: error.message });
  }
};