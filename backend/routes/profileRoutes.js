import express from 'express';
import multer from 'multer';
import { createProfile, updateProfile, getProfile, getRecommendations, getUserById, getSharedHobbies, testRecommendations, debugEmbeddings } from '../controllers/profileController.js';
import { getDashboardStats } from '../controllers/followController.js';
import { authMiddleware } from '../utils/authMiddleware.js';

const router = express.Router();

// Multer setup for profile picture upload
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.get('/profile', authMiddleware, getProfile);
router.post('/profile', authMiddleware, createProfile);
// MULTER middleware added here:
router.put('/profile/update', authMiddleware, upload.single('profile_picture'), updateProfile);
router.get('/recommendations', authMiddleware, getRecommendations);
router.get('/test-recommendations', authMiddleware, testRecommendations);
router.get('/debug-embeddings', authMiddleware, debugEmbeddings);
router.get('/user/:id', authMiddleware, getUserById);
router.get('/match/hobbies/:id', authMiddleware, getSharedHobbies);
router.get('/dashboard-stats', authMiddleware, getDashboardStats);

export default router;
