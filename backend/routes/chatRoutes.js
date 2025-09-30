import express from 'express';
import { getChatWithUser, sendMessage, getUserChats, getUnreadCount, deleteMessage, markMessagesAsRead, getChatUnreadCount, editMessage, deleteEntireChat, generateAIMessage, bulkDeleteMessages } from '../controllers/chatController.js';
import { upload } from '../config/cloudinary.js';
import { authMiddleware } from '../utils/authMiddleware.js';

const router = express.Router();

router.get('/chat/:userId', authMiddleware, getChatWithUser);
router.get('/chat/ai-assistant', authMiddleware, getChatWithUser);
router.post('/chat', authMiddleware, sendMessage);
router.post('/chat/upload', authMiddleware, upload.single('file'), sendMessage);
router.delete('/chat/message/:messageId', authMiddleware, deleteMessage);
router.delete('/chat/messages/bulk', authMiddleware, bulkDeleteMessages);
router.delete('/chat/:userId', authMiddleware, deleteEntireChat);
router.get('/chats', authMiddleware, getUserChats);
router.get('/unread-count', authMiddleware, getUnreadCount);
router.post('/mark-read', authMiddleware, markMessagesAsRead);
router.get('/chat-unread/:partnerId', authMiddleware, getChatUnreadCount);
router.put('/chat/message/:messageId', authMiddleware, editMessage);
router.post('/chat/ai', authMiddleware, generateAIMessage);

export default router;