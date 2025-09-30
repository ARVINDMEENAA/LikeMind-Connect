import { checkSpacyAvailability } from './spacyEmbeddings.js';
import { checkPineconeHealth } from './pinecone.js';

export const checkSystemHealth = async () => {
  const health = {
    spacy: false,
    pinecone: false,
    overall: false
  };

  try {
    health.spacy = await checkSpacyAvailability();
  } catch (error) {
    console.error('spaCy health check failed:', error.message);
  }

  try {
    health.pinecone = await checkPineconeHealth();
  } catch (error) {
    console.error('Pinecone health check failed:', error.message);
  }

  health.overall = health.spacy && health.pinecone;
  
  return health;
};