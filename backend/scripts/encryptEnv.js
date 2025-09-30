import fs from 'fs';
import path from 'path';
import { encrypt } from '../utils/encryption.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load current .env
const envPath = path.join(__dirname, '../.env');
const envContent = fs.readFileSync(envPath, 'utf8');

// Parse and encrypt sensitive values
const lines = envContent.split('\n');
const encryptedLines = lines.map(line => {
  if (line.trim() === '' || line.startsWith('#')) return line;
  
  const [key, ...valueParts] = line.split('=');
  const value = valueParts.join('=');
  
  // Encrypt sensitive keys
  const sensitiveKeys = [
    'MONGODB_URI', 'JWT_SECRET', 'PINECONE_API_KEY', 
    'CLOUDINARY_API_SECRET', 'GEMINI_API_KEY', 
    'EMAIL_PASS', 'ENCRYPTION_KEY'
  ];
  
  if (sensitiveKeys.includes(key) && value && !value.includes(':')) {
    const encryptionKey = 'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456';
    return `${key}=${encrypt(value, encryptionKey)}`;
  }
  
  return line;
});

// Write encrypted .env
fs.writeFileSync(envPath, encryptedLines.join('\n'));
console.log('✅ .env file encrypted successfully!');