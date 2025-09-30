import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Debug: Log environment variables
console.log('🔧 Cloudinary Config Debug:', {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || '❌ Missing',
  api_key: process.env.CLOUDINARY_API_KEY || '❌ Missing',
  api_secret: process.env.CLOUDINARY_API_SECRET || '❌ Missing'
});

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: (req, file) => {
    let resourceType = 'auto';
    if (file.mimetype.startsWith('video/')) {
      resourceType = 'video';
    } else if (file.mimetype.startsWith('image/')) {
      resourceType = 'image';
    } else if (file.mimetype.startsWith('audio/')) {
      resourceType = 'video'; // Cloudinary uses 'video' for audio files
    } else {
      resourceType = 'raw';
    }
    
    return {
      folder: 'chat-files',
      resource_type: resourceType,
      allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv', 'mp4', 'avi', 'mov', 'webm', 'mkv', 'mp3', 'wav', 'ogg', 'm4a']
    };
  }
});

export const upload = multer({ 
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit for videos
    fieldSize: 100 * 1024 * 1024
  },
  onError: (err, next) => {
    console.error('🚨 Multer Error:', err);
    next(err);
  }
});

export default cloudinary;