import crypto from 'crypto';

// Generate a new 256-bit (32 bytes) encryption key
const newKey = crypto.randomBytes(32).toString('hex');
console.log('New Encryption Key:', newKey);
console.log('Length:', newKey.length, 'characters');