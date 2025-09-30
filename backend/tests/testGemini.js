import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const testGeminiAPI = async () => {
  try {
    console.log('🔑 Testing Gemini API Key...');
    console.log('API Key:', process.env.GEMINI_API_KEY);
    
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    // List available models
    console.log('📋 Listing available models...');
    const models = await genAI.listModels();
    console.log('Available models:', models.map(m => m.name));
    
    // Test with a simple model
    const model = genAI.getGenerativeModel({ model: "gemini-1.0-pro-latest" });
    
    console.log('🧪 Testing content generation...');
    const result = await model.generateContent("Hello, how are you?");
    const response = await result.response;
    const text = response.text();
    
    console.log('✅ Success! Response:', text);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Status:', error.status);
    console.error('Details:', error);
  }
};

testGeminiAPI();