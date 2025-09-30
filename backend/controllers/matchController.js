import User from '../models/User.js';

// Same cosine similarity function as profileController
const calculateCosineSimilarity = (embedding1, embedding2) => {
  const dotProduct = embedding1.reduce((sum, a, i) => sum + a * embedding2[i], 0);
  const magnitude1 = Math.sqrt(embedding1.reduce((sum, a) => sum + a * a, 0));
  const magnitude2 = Math.sqrt(embedding2.reduce((sum, a) => sum + a * a, 0));
  
  return dotProduct / (magnitude1 * magnitude2);
};

export const getMatchPercentage = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.userId;
    
    const [currentUser, targetUser] = await Promise.all([
      User.findById(currentUserId),
      User.findById(userId)
    ]);
    
    if (!currentUser || !targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Find shared hobbies
    const sharedHobbies = (currentUser.hobbies || []).filter(hobby => 
      (targetUser.hobbies || []).some(targetHobby => 
        targetHobby.toLowerCase().includes(hobby.toLowerCase()) || 
        hobby.toLowerCase().includes(targetHobby.toLowerCase())
      )
    );
    
    // Check for exact hobby matches first
    const exactMatches = (currentUser.hobbies || []).filter(hobby => 
      (targetUser.hobbies || []).some(targetHobby => 
        targetHobby.toLowerCase() === hobby.toLowerCase()
      )
    );
    
    let matchPercentage = 60; // Default
    
    if (exactMatches.length > 0 && exactMatches.length === (currentUser.hobbies || []).length && exactMatches.length === (targetUser.hobbies || []).length) {
      matchPercentage = 100; // Perfect match
    } else if (exactMatches.length > 0) {
      matchPercentage = Math.max(85, 85 + (exactMatches.length * 5)); // Boost for exact matches
    } else if (currentUser.embedding && targetUser.embedding) {
      try {
        const similarity = calculateCosineSimilarity(currentUser.embedding, targetUser.embedding);
        if (isNaN(similarity) || !isFinite(similarity)) {
          matchPercentage = 60;
        } else {
          matchPercentage = Math.min(95, Math.max(60, Math.round(similarity * 100)));
        }
      } catch (error) {
        console.error('Cosine similarity error:', error.message);
        matchPercentage = 60;
      }
    }
    
    console.log(`🤖 Match: ${currentUser.name} ↔ ${targetUser.name} = ${Math.min(100, matchPercentage)}%`);
    
    res.json({
      matchPercentage: Math.min(100, matchPercentage),
      sharedHobbies,
      similarity: matchPercentage / 100
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};