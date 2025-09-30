import express from 'express';
import { blockUser, unblockUser, getBlockedUsers } from '../controllers/blockController.js';
import { authMiddleware } from '../utils/authMiddleware.js';

const router = express.Router();

router.post('/block', authMiddleware, blockUser);
router.post('/unblock', authMiddleware, unblockUser);
router.get('/blocked-users', authMiddleware, getBlockedUsers);

export default router;