import { Pinecone } from '@pinecone-database/pinecone';

let pc, index;

const initializePinecone = () => {
  if (!pc && process.env.PINECONE_API_KEY) {
    try {
      pc = new Pinecone({
        apiKey: process.env.PINECONE_API_KEY,
      });
      index = pc.index(process.env.PINECONE_INDEX_NAME);
      console.log('✅ Pinecone initialized successfully');
    } catch (error) {
      console.error('❌ Pinecone initialization failed:', error.message);
      throw new Error('Pinecone configuration error');
    }
  }
  return { pc, index };
};

export const upsertUserEmbedding = async (userId, embedding, metadata = {}) => {
  try {
    const { index } = initializePinecone();
    if (!index) {
      throw new Error('Pinecone not configured');
    }
    
    await index.upsert([{
      id: userId.toString(),
      values: embedding,
      metadata: { userId: userId.toString(), ...metadata }
    }]);
    
    console.log(`✅ Upserted embedding for user ${userId}`);
  } catch (error) {
    console.error('❌ Pinecone upsert failed:', error.message);
    throw error;
  }
};

export const findSimilarUsers = async (embedding, topK = 5, excludeUserId = null) => {
  try {
    const { index } = initializePinecone();
    if (!index) {
      throw new Error('Pinecone not configured');
    }
    
    const queryResponse = await index.query({
      vector: embedding,
      topK: excludeUserId ? topK + 1 : topK,
      includeMetadata: true
    });

    let matches = queryResponse.matches || [];
    
    if (excludeUserId) {
      matches = matches.filter(match => match.id !== excludeUserId.toString());
      matches = matches.slice(0, topK);
    }

    console.log(`✅ Found ${matches.length} similar users`);
    return matches.map(match => ({
      userId: match.id,
      similarity: Math.round(match.score * 100) // Convert to percentage
    }));
  } catch (error) {
    console.error('❌ Pinecone query failed:', error.message);
    throw error;
  }
};

export const getSimilarityScore = (embedding1, embedding2) => {
  // Calculate cosine similarity between two embeddings
  const dotProduct = embedding1.reduce((sum, a, i) => sum + a * embedding2[i], 0);
  const magnitude1 = Math.sqrt(embedding1.reduce((sum, a) => sum + a * a, 0));
  const magnitude2 = Math.sqrt(embedding2.reduce((sum, a) => sum + a * a, 0));
  
  const similarity = dotProduct / (magnitude1 * magnitude2);
  return Math.round(similarity * 100); // Convert to percentage
};

export const checkPineconeHealth = async () => {
  try {
    const { index } = initializePinecone();
    if (!index) return false;
    
    await index.describeIndexStats();
    return true;
  } catch (error) {
    return false;
  }
};

export const calculateHobbyMatchPercentage = (userHobbies, targetHobbies) => {
  if (!userHobbies?.length || !targetHobbies?.length) return 0;
  
  const hobbyMatches = [];
  
  for (const userHobby of userHobbies) {
    let bestMatch = 0;
    let matchedHobby = null;
    
    for (const targetHobby of targetHobbies) {
      // Calculate similarity between individual hobby embeddings
      if (userHobby.embedding && targetHobby.embedding) {
        const similarity = getSimilarityScore(userHobby.embedding, targetHobby.embedding);
        if (similarity > bestMatch) {
          bestMatch = similarity;
          matchedHobby = targetHobby.hobby;
        }
      }
    }
    
    if (bestMatch > 70) { // Threshold for considering a match
      hobbyMatches.push({
        userHobby: userHobby.hobby,
        matchedHobby,
        similarity: bestMatch
      });
    }
  }
  
  if (hobbyMatches.length === 0) return 0;
  
  // Calculate overall match percentage
  const avgSimilarity = hobbyMatches.reduce((sum, match) => sum + match.similarity, 0) / hobbyMatches.length;
  const coverageBonus = (hobbyMatches.length / Math.max(userHobbies.length, targetHobbies.length)) * 20;
  
  return Math.min(95, Math.max(60, Math.round(avgSimilarity + coverageBonus)));
};
