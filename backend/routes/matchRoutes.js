import express from 'express';
import { getMatchPercentage } from '../controllers/matchController.js';
import { authMiddleware } from '../utils/authMiddleware.js';

const router = express.Router();

router.get('/match/percentage/:userId', authMiddleware, getMatchPercentage);

export default router;