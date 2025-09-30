import express from 'express';
import { upload } from '../config/cloudinary.js';
import { authMiddleware } from '../utils/authMiddleware.js';

const router = express.Router();

router.post('/test-upload', authMiddleware, upload.single('file'), (req, res) => {
  try {
    console.log('🧪 Test Upload - Headers:', req.headers);
    console.log('🧪 Test Upload - Body:', req.body);
    console.log('🧪 Test Upload - File:', req.file);
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    res.json({
      success: true,
      file: req.file,
      message: 'File uploaded successfully'
    });
  } catch (error) {
    console.error('🧪 Test Upload Error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;