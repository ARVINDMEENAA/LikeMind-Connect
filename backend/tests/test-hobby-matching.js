// Test script to demonstrate individual hobby matching

const testHobbyMatching = () => {
  // Simulated embeddings (normally from spaCy)
  const userA_hobbies = [
    { hobby: "Cricket", embedding: [0.1, 0.8, 0.3, 0.2] },
    { hobby: "Photography", embedding: [0.7, 0.2, 0.9, 0.4] }
  ];
  
  const userB_hobbies = [
    { hobby: "Football", embedding: [0.2, 0.7, 0.4, 0.1] },
    { hobby: "Photography", embedding: [0.7, 0.2, 0.9, 0.4] }
  ];

  console.log("=== Individual Hobby Matching Demo ===\n");
  
  // Calculate similarities
  const matches = [];
  
  for (const userHobby of userA_hobbies) {
    let bestMatch = 0;
    let matchedHobby = null;
    
    for (const targetHobby of userB_hobbies) {
      const similarity = calculateSimilarity(userHobby.embedding, targetHobby.embedding);
      console.log(`${userHobby.hobby} vs ${targetHobby.hobby}: ${similarity}%`);
      
      if (similarity > bestMatch) {
        bestMatch = similarity;
        matchedHobby = targetHobby.hobby;
      }
    }
    
    if (bestMatch > 70) {
      matches.push({
        userHobby: userHobby.hobby,
        matchedHobby,
        similarity: bestMatch
      });
      console.log(`✅ MATCH: ${userHobby.hobby} → ${matchedHobby} (${bestMatch}%)\n`);
    } else {
      console.log(`❌ NO MATCH: ${userHobby.hobby} best was ${bestMatch}%\n`);
    }
  }
  
  // Calculate final percentage
  if (matches.length > 0) {
    const avgSimilarity = matches.reduce((sum, match) => sum + match.similarity, 0) / matches.length;
    const coverageBonus = (matches.length / Math.max(userA_hobbies.length, userB_hobbies.length)) * 20;
    const finalMatch = Math.min(95, Math.max(60, Math.round(avgSimilarity + coverageBonus)));
    
    console.log(`Final Match Percentage: ${finalMatch}%`);
    console.log(`- Average Similarity: ${avgSimilarity}%`);
    console.log(`- Coverage Bonus: ${coverageBonus}%`);
    console.log(`- Matched Hobbies: ${matches.length}/${userA_hobbies.length}`);
  } else {
    console.log("No matches found - Default 60% match");
  }
};

function calculateSimilarity(emb1, emb2) {
  const dotProduct = emb1.reduce((sum, a, i) => sum + a * emb2[i], 0);
  const mag1 = Math.sqrt(emb1.reduce((sum, a) => sum + a * a, 0));
  const mag2 = Math.sqrt(emb2.reduce((sum, a) => sum + a * a, 0));
  return Math.round((dotProduct / (mag1 * mag2)) * 100);
}

testHobbyMatching();