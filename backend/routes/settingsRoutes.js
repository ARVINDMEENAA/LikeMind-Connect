import express from 'express';
import { updateSettings, logout } from '../controllers/settingsController.js';

const router = express.Router();

router.put('/account', updateSettings);
router.post('/logout', logout);

export default router;