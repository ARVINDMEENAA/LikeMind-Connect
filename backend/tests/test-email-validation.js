import { validateEmailFlow } from './utils/emailValidationFlow.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI);

const testEmails = [
  'test@gmail.com',           // Valid
  'invalid@yahoo.com',        // Invalid domain
  'test..test@gmail.com',     // Invalid format
  '.test@gmail.com',          // Invalid format
  'test.@gmail.com',          // Invalid format
  'test@notgmail.com',        // Invalid domain
  'validuser123@gmail.com'    // Valid
];

async function testEmailValidation() {
  console.log('🧪 Testing Email Validation Flow\n');
  
  for (const email of testEmails) {
    console.log(`Testing: ${email}`);
    const result = await validateEmailFlow(email);
    console.log(`  ✅ Valid: ${result.valid}`);
    console.log(`  📍 Step: ${result.step}`);
    console.log(`  💬 Reason: ${result.reason}`);
    console.log(`  📊 Details:`, result.details);
    console.log('---');
  }
  
  mongoose.disconnect();
}

testEmailValidation().catch(console.error);