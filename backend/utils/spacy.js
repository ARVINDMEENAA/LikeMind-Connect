import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const SPACY_API_URL = process.env.SPACY_API_URL || 'http://localhost:8000';

export const getEmbedding = async (text) => {
  try {
    console.log('Generating spaCy embedding for text:', text);
    
    const response = await axios.post(`${SPACY_API_URL}/embeddings`, {
      text: text
    }, {
      timeout: 10000, // 10 second timeout
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.data && response.data.embedding) {
      console.log(`✅ spaCy embedding generated successfully (${response.data.embedding.length} dimensions)`);
      return response.data.embedding;
    } else {
      throw new Error('Invalid response from spaCy service');
    }
    
  } catch (error) {
    console.error('spaCy embedding error:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      throw new Error('spaCy service is not running. Please start it with: python spacy_service.py');
    }
    
    if (error.response) {
      throw new Error(`spaCy service error: ${error.response.data?.error || error.response.statusText}`);
    }
    
    throw error;
  }
};

// Health check function for spaCy service
export const checkSpacyService = async () => {
  try {
    const response = await axios.get(`${SPACY_API_URL}/health`, { timeout: 5000 });
    return response.data;
  } catch (error) {
    throw new Error('spaCy service is not available');
  }
};