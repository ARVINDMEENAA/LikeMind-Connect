import express from 'express';
import { upload } from './config/cloudinary.js';

const app = express();

app.post('/test-upload', upload.single('file'), (req, res) => {
  console.log('Test upload - File:', req.file);
  console.log('Test upload - Body:', req.body);
  
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  
  res.json({
    success: true,
    file: {
      filename: req.file.filename,
      path: req.file.path,
      size: req.file.size
    }
  });
});

app.listen(3001, () => {
  console.log('Test upload server running on port 3001');
});