import express from 'express';
import { updateHobbiesAndGetRecommendations, getHobbyRecommendations } from '../controllers/hobbyController.js';
import { authMiddleware } from '../utils/authMiddleware.js';

const router = express.Router();

router.post('/update', authMiddleware, updateHobbiesAndGetRecommendations);
router.get('/recommendations', authMiddleware, getHobbyRecommendations);

export default router;