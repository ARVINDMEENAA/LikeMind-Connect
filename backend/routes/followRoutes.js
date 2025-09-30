import express from 'express';
import { 
  sendFollowRequest, 
  acceptFollowRequest, 
  rejectFollowRequest,
  getFollowers,
  getFollowing,
  getConnections,
  getPendingRequests,
  getDashboardStats,
  getFollowStatus
} from '../controllers/followController.js';
import { authMiddleware } from '../utils/authMiddleware.js';

const router = express.Router();

router.post('/follow', authMiddleware, sendFollowRequest);
router.post('/follow/accept', authMiddleware, acceptFollowRequest);
router.post('/follow/reject', authMiddleware, rejectFollowRequest);
router.get('/followers', authMiddleware, getFollowers);
router.get('/following', authMiddleware, getFollowing);
router.get('/user/:userId/followers', authMiddleware, getFollowers);
router.get('/user/:userId/following', authMiddleware, getFollowing);
router.get('/connections', authMiddleware, getConnections);
router.get('/pending-requests', authMiddleware, getPendingRequests);
router.get('/follow/pending-requests', authMiddleware, getPendingRequests);
router.get('/dashboard-stats', authMiddleware, getDashboardStats);
router.get('/follow/status', authMiddleware, getFollowStatus);

export default router;