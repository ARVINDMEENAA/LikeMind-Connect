import { getEmbedding, checkSpacyService } from './spacy.js';

export const generateHobbyEmbedding = async (hobbies) => {
  if (!Array.isArray(hobbies) || hobbies.length === 0) {
    throw new Error('Hobbies must be a non-empty array');
  }

  // Join hobbies and get embedding from spaCy server
  const hobbyText = hobbies.join(' ');
  const embedding = await getEmbedding(hobbyText);
  
  if (!embedding || embedding.length === 0) {
    throw new Error('Failed to generate embedding vector');
  }
  
  console.log(`Generated embedding for "${hobbyText}" (${embedding.length} dimensions)`);
  return embedding;
};

export const checkSpacyAvailability = async () => {
  try {
    await checkSpacyService();
    return true;
  } catch (error) {
    return false;
  }
};