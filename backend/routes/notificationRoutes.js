import express from 'express';
import { getNotifications, markAsRead, getUnreadCount, deleteNotification, followBackFromNotification, ignoreNotification } from '../controllers/notificationController.js';
import { authMiddleware } from '../utils/authMiddleware.js';

const router = express.Router();

router.get('/', authMiddleware, getNotifications);
router.post('/read', authMiddleware, markAsRead);
router.delete('/:id', authMiddleware, deleteNotification);
router.get('/unread-count', authMiddleware, getUnreadCount);
router.post('/follow-back', authMiddleware, followBackFromNotification);
router.post('/ignore', authMiddleware, ignoreNotification);

export default router;