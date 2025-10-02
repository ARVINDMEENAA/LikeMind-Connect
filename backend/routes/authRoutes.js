import express from 'express';
import { signup, login, logout, verifyEmail, getMe, forgotPassword, resetPassword } from '../controllers/authController.js';
import { auth } from '../middleware/auth.js';
import { passwordResetLimiter, authLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Public routes with rate limiting
router.post('/signup', authLimiter, signup);
router.post('/login', authLimiter, login);
router.get('/verify-email/:token', (req, res, next) => {
  console.log('🔥 Verify email route hit with token:', req.params.token);
  next();
}, verifyEmail);
router.get('/test-verify', (req, res) => {
  console.log('Test verify route hit');
  res.json({ message: 'Test route working' });
});
router.post('/forgot-password', passwordResetLimiter, forgotPassword);
router.post('/reset-password/:token', authLimiter, resetPassword);

// Protected routes
router.post('/logout', auth, logout);
router.get('/me', auth, getMe);

export default router;
