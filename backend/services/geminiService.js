import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const generateAIResponse = async (userMessage) => {
  try {
    console.log('🤖 Gemini Service - Input:', userMessage);
    console.log('🤖 Gemini API Key:', process.env.GEMINI_API_KEY ? 'Present' : 'Missing');
    
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
      console.error('🤖 Invalid Gemini API Key');
      return "Please configure a valid Gemini API key in the environment variables.";
    }
    
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    const prompt = `You are a helpful AI assistant in a social networking app called LikeMind Connect. 
    Users can share their problems, ask for advice, or just chat. Be friendly, supportive, and helpful.
    Keep responses concise and engaging.
    
    User message: ${userMessage}`;
    
    console.log('🤖 Sending request to Gemini...');
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log('🤖 Gemini Response:', text);
    return text;
  } catch (error) {
    console.error('🤖 Gemini API Error Details:', {
      message: error.message,
      status: error.status,
      statusText: error.statusText,
      stack: error.stack
    });
    
    if (error.message?.includes('quota') || error.message?.includes('QUOTA_EXCEEDED')) {
      return "I'm currently experiencing high traffic. Please try again in a few minutes! 😊";
    }
    if (error.message?.includes('API_KEY') || error.message?.includes('authentication')) {
      return "API key issue detected. Please check the configuration.";
    }
    if (error.message?.includes('SAFETY')) {
      return "I can't respond to that message due to safety guidelines. Please try a different question.";
    }
    
    return "Sorry, I'm having trouble responding right now. Please try again later! 🤖";
  }
};