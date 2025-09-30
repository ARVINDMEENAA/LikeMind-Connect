import express from 'express';
import { createProfile, updateProfile, getProfile, getRecommendations, getUserById, getSharedHobbies, testRecommendations, debugEmbeddings } from '../controllers/profileController.js';
import { getDashboardStats } from '../controllers/followController.js';
import { authMiddleware } from '../utils/authMiddleware.js';

const router = express.Router();

router.get('/profile', authMiddleware, getProfile);
router.post('/profile', authMiddleware, createProfile);
router.put('/profile/update', authMiddleware, updateProfile);
router.get('/recommendations', authMiddleware, getRecommendations);
router.get('/test-recommendations', authMiddleware, testRecommendations);
router.get('/debug-embeddings', authMiddleware, debugEmbeddings);
router.get('/user/:id', authMiddleware, getUserById);
router.get('/match/hobbies/:id', authMiddleware, getSharedHobbies);
router.get('/dashboard-stats', authMiddleware, getDashboardStats);

export default router;