import User from '../models/User.js';
import Follow from '../models/Follow.js';
import Block from '../models/Block.js';
import { generateEmbedding } from '../utils/embeddings.js';
import { upsertUserEmbedding, findSimilarUsers } from '../utils/pinecone.js';

// Helper function for cosine similarity
const calculateCosineSimilarity = (embedding1, embedding2) => {
  const dotProduct = embedding1.reduce((sum, a, i) => sum + a * embedding2[i], 0);
  const magnitude1 = Math.sqrt(embedding1.reduce((sum, a) => sum + a * a, 0));
  const magnitude2 = Math.sqrt(embedding2.reduce((sum, a) => sum + a * a, 0));
  return dotProduct / (magnitude1 * magnitude2);
};

export const createProfile = async (req, res) => {
  try {
    const { hobbies, age, gender, profile_picture, name, bio, location, occupation } = req.body;
    const userId = req.user.userId;

    console.log('Received create profile data:', req.body);

    const updateData = {};

    if (hobbies !== undefined && Array.isArray(hobbies)) {
      updateData.hobbies = hobbies;
      if (hobbies.length > 0) {
        const hobbiesText = hobbies.join(' ');
        console.log('🤖 Generating embedding for hobbies:', hobbiesText);

        try {
          const embedding = await generateEmbedding(hobbiesText);

          if (embedding && embedding.length > 0) {
            updateData.embedding = embedding;
            console.log('✅ Embedding generated successfully, length:', embedding.length);

            // Store in Pinecone - MANDATORY for advanced matching
            if (process.env.PINECONE_API_KEY) {
              try {
                await upsertUserEmbedding(userId, embedding, {
                  userId: userId.toString(),
                  hobbies: hobbies,
                  name: name || 'Unknown'
                });
                console.log('✅ Stored in Pinecone successfully');
              } catch (pineconeError) {
                console.error('❌ Pinecone storage failed:', pineconeError.message);
                // Don't fail the whole operation if Pinecone fails
              }
            } else {
              console.log('⚠️ Pinecone not configured');
            }
          } else {
            console.log('❌ Embedding generation failed');
          }
        } catch (embeddingError) {
          console.error('❌ Embedding error:', embeddingError.message);
        }
      }
    }

    if (name) updateData.name = name;
    if (bio) updateData.bio = bio;
    if (location) updateData.location = location;
    if (occupation) updateData.occupation = occupation;
    if (age) updateData.age = parseInt(age);
    if (gender) updateData.gender = gender;
    if (profile_picture) updateData.profile_picture = profile_picture;

    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'Profile created successfully',
      user
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { hobbies, age, gender, profile_picture, name, bio, location, occupation } = req.body;
    const userId = req.user.userId;

    console.log('Received update data:', req.body);

    const updateData = {};

    // Parse hobbies if it's a string (when sent as FormData)
    let parsedHobbies = [];
    if (hobbies) {
      if (typeof hobbies === 'string') {
        try {
          parsedHobbies = JSON.parse(hobbies);
        } catch (e) {
          parsedHobbies = [];
        }
      } else if (Array.isArray(hobbies)) {
        parsedHobbies = hobbies;
      }
    }

    if (parsedHobbies.length > 0) {
      updateData.hobbies = parsedHobbies;
      const hobbiesText = parsedHobbies.join(' ');
      console.log('Hobbies text for embedding:', hobbiesText);
      const embedding = await generateEmbedding(hobbiesText);
      console.log('Generated embedding:', embedding ? 'Success' : 'Failed');
      console.log('Embedding length:', embedding ? embedding.length : 0);

      if (embedding && embedding.length > 0) {
        updateData.embedding = embedding;

        // Store in Pinecone (optional)
        if (process.env.PINECONE_API_KEY) {
          try {
            console.log('Storing in Pinecone - User ID:', userId, 'Hobbies:', parsedHobbies);
            await upsertUserEmbedding(userId, embedding, {
              userId: userId.toString(),
              hobbies: parsedHobbies,
              name: name || user?.name || 'Unknown'
            });
            console.log('✅ Stored in Pinecone successfully');
          } catch (error) {
            console.error('❌ Pinecone storage failed:', error.message);
          }
        } else {
          console.log('ℹ️ Pinecone not configured, skipping vector storage');
        }
      } else {
        console.log('⚠️ Embedding generation failed, profile saved without embedding');
      }
    }

    if (name) updateData.name = name;
    if (bio) updateData.bio = bio;
    if (location) updateData.location = location;
    if (occupation) updateData.occupation = occupation;
    if (age) updateData.age = parseInt(age);
    if (gender) updateData.gender = gender;
    if (profile_picture) updateData.profile_picture = profile_picture;

    // Handle file upload (if using multer)
    if (req.file) {
      updateData.profile_picture = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    }

    console.log('Update data being saved to MongoDB:', updateData);
    console.log('User ID:', userId);

    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('Updated user in MongoDB:', {
      id: user._id,
      hobbies: user.hobbies,
      embedding: user.embedding ? `Array of ${user.embedding.length} values` : 'null'
    });

    res.json({
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getProfile = async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = await User.findById(userId).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const testRecommendations = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId);
    const allUsers = await User.find({ _id: { $ne: userId } }).select('name hobbies embedding');

    res.json({
      currentUser: {
        id: user._id,
        name: user.name,
        hobbies: user.hobbies || [],
        hasEmbedding: !!user.embedding,
        embeddingLength: user.embedding ? user.embedding.length : 0
      },
      allUsers: allUsers.map(u => ({
        id: u._id,
        name: u.name,
        hobbies: u.hobbies || [],
        hasEmbedding: !!u.embedding,
        embeddingLength: u.embedding ? u.embedding.length : 0
      }))
    });
  } catch (error) {
    res.json({ error: error.message });
  }
};

export const getRecommendations = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Always fetch fresh user data to get latest hobbies
    const user = await User.findById(userId).lean();
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // If user has no hobbies, return empty recommendations
    if (!user.hobbies || user.hobbies.length === 0) {
      console.log('❌ User has no hobbies:', user.hobbies);
      return res.json({ recommendations: [] });
    }

    console.log('✅ User hobbies:', user.hobbies);
    console.log('✅ User embedding exists:', !!user.embedding);
    console.log('✅ User embedding length:', user.embedding ? user.embedding.length : 0);
    console.log('✅ User embedding sample:', user.embedding ? user.embedding.slice(0, 5) : 'null');
    console.log('✅ User hobbies text for embedding:', user.hobbies.join(' '));

    // 🚀 ADVANCED SpaCy + Pinecone Matching
    let potentialMatches = [];

    if (user.embedding && Array.isArray(user.embedding) && user.embedding.length > 0 && process.env.PINECONE_API_KEY) {
      try {
        console.log('🤖 Using ADVANCED SpaCy + Pinecone matching');

        // Get similar users from Pinecone with similarity scores
        const similarUsers = await findSimilarUsers(user.embedding, 50, userId);

        console.log('🔍 Pinecone similar users:', similarUsers.map(u => ({ userId: u.userId, similarity: u.similarity })));

        if (similarUsers.length > 0) {
          const userIds = similarUsers.map(u => u.userId);
          const users = await User.find({ _id: { $in: userIds } }).select('-password -embedding');

          console.log('🔍 Found users from Pinecone IDs:', users.map(u => ({ name: u.name, hobbies: u.hobbies })));

          // Map users with their AI similarity scores and shared hobbies
          potentialMatches = users.map(match => {
            const similarUser = similarUsers.find(s => s.userId === match._id.toString());
            const matchObj = match.toObject ? match.toObject() : match;

            // Calculate shared hobbies
            const userHobbies = user.hobbies || [];
            const matchHobbies = match.hobbies || [];
            const sharedHobbies = userHobbies.filter(hobby =>
              matchHobbies.some(matchHobby =>
                matchHobby.toLowerCase().includes(hobby.toLowerCase()) ||
                hobby.toLowerCase().includes(matchHobby.toLowerCase())
              )
            );

            // Check for exact hobby matches - if all hobbies match exactly, give 100%
            let finalMatchPercentage = similarUser ? similarUser.similarity : 0;
            const exactMatches = userHobbies.filter(hobby =>
              matchHobbies.some(matchHobby =>
                matchHobby.toLowerCase() === hobby.toLowerCase()
              )
            );

            if (exactMatches.length > 0 && exactMatches.length === userHobbies.length && exactMatches.length === matchHobbies.length) {
              finalMatchPercentage = 100;
            } else if (exactMatches.length > 0) {
              // Boost percentage for exact matches
              finalMatchPercentage = Math.max(finalMatchPercentage, 85 + (exactMatches.length * 5));
            }

            return {
              ...matchObj,
              matchPercentage: Math.min(100, finalMatchPercentage),
              sharedHobbies
            };
          }).filter(match => match.matchPercentage >= 80); // Only 80%+ premium matches

          console.log(`✅ Pinecone found ${potentialMatches.length} AI-powered matches`);
        }
      } catch (error) {
        console.error('❌ Pinecone error:', error.message);
      }
    }

    // Fallback to cosine similarity if Pinecone fails or embedding is empty
    if (potentialMatches.length === 0) {
      console.log('🔄 Fallback: Using cosine similarity matching');
      const allUsers = await User.find({
        _id: { $ne: userId },
        embedding: { $exists: true, $ne: null }
      }).select('-password');

      console.log('📊 Found users with embeddings:', allUsers.length);
      console.log('📊 Users with embeddings:', allUsers.map(u => ({ name: u.name, hobbies: u.hobbies, hasEmbedding: !!u.embedding })));

      if (user.embedding && Array.isArray(user.embedding) && user.embedding.length > 0) {
        potentialMatches = allUsers.map(match => {
          const userHobbies = user.hobbies || [];
          const matchHobbies = match.hobbies || [];

          const sharedHobbies = userHobbies.filter(hobby =>
            matchHobbies.some(matchHobby =>
              matchHobby.toLowerCase().includes(hobby.toLowerCase()) ||
              hobby.toLowerCase().includes(matchHobby.toLowerCase())
            )
          );

          // Check for exact hobby matches first
          const exactMatches = userHobbies.filter(hobby =>
            matchHobbies.some(matchHobby =>
              matchHobby.toLowerCase() === hobby.toLowerCase()
            )
          );

          let matchPercentage;
          let similarity = 0;
          if (exactMatches.length > 0 && exactMatches.length === userHobbies.length && exactMatches.length === matchHobbies.length) {
            matchPercentage = 100; // Perfect match
          } else if (exactMatches.length > 0) {
            matchPercentage = Math.max(85, 85 + (exactMatches.length * 5)); // Boost for exact matches
          } else {
            // Use cosine similarity for match percentage
            try {
              similarity = calculateCosineSimilarity(user.embedding, match.embedding);
              if (isNaN(similarity) || !isFinite(similarity)) {
                similarity = 0.6; // Default similarity
              }
            } catch (error) {
              console.error('Cosine similarity error:', error.message);
              similarity = 0.6;
            }
            matchPercentage = Math.min(95, Math.max(60, Math.round(similarity * 100)));
          }

          console.log(`🔍 Match: ${match.name} - ${matchPercentage}% (similarity: ${similarity}) (hobbies: ${match.hobbies})`);
          console.log(`🔍 ${match.name} embedding sample:`, match.embedding ? match.embedding.slice(0, 5) : 'null');
          console.log(`🔍 ${match.name} hobbies text:`, match.hobbies.join(' '));

          const matchObj = match.toObject ? match.toObject() : match;
          return {
            ...matchObj,
            matchPercentage: Math.min(100, matchPercentage),
            sharedHobbies,
            similarity // for debugging, can be removed from final output
          };
        }).sort((a, b) => {
          // Priority: exact hobby matches first
          const aExactMatch = a.hobbies.some(h => user.hobbies.includes(h));
          const bExactMatch = b.hobbies.some(h => user.hobbies.includes(h));
          if (aExactMatch && !bExactMatch) return -1;
          if (!aExactMatch && bExactMatch) return 1;
          return b.matchPercentage - a.matchPercentage;
        }).filter(match => match.matchPercentage >= 75); // Only show 75%+ close matches
      } else {
        console.log('❌ Current user has no embedding');
      }
    }

    console.log('🔍 Total potential matches:', potentialMatches.length);

    // If no 80%+ matches found, show message
    if (potentialMatches.length === 0) {
      console.log('⚡ No premium matches (80%+) found');
      return res.json({
        recommendations: [],
        message: 'No high-quality matches found. Try updating your hobbies for better results.'
      });
    }

    // Get all follow relationships for current user
    const followRelationships = await Follow.find({
      $or: [
        { follower: userId },
        { following: userId }
      ]
    });

    // Get blocked users
    const blockedUsers = await Block.find({
      $or: [
        { blocker: userId },
        { blocked: userId }
      ]
    });

    const blockedUserIds = new Set();
    blockedUsers.forEach(block => {
      blockedUserIds.add(block.blocker.toString());
      blockedUserIds.add(block.blocked.toString());
    });

    // Only filter out users who are already connected (accepted status)
    const connectedUserIds = new Set();
    followRelationships.forEach(follow => {
      if (follow.status === 'accepted') {
        connectedUserIds.add(follow.follower.toString());
        connectedUserIds.add(follow.following.toString());
      }
    });

    // Add follow status to each recommendation
    console.log('🔍 Before filtering - potential matches:', potentialMatches.length);
    console.log('🔍 Connected user IDs:', Array.from(connectedUserIds));

    const filteredMatches = potentialMatches.filter(match =>
      !connectedUserIds.has(match._id.toString()) &&
      !blockedUserIds.has(match._id.toString())
    );

    console.log('🔍 After filtering connected users:', filteredMatches.length);

    const recommendations = filteredMatches
      .slice(0, 10)
      .map(match => {
        const followRequest = followRelationships.find(f =>
          (f.follower.toString() === userId && f.following.toString() === match._id.toString()) ||
          (f.following.toString() === userId && f.follower.toString() === match._id.toString())
        );

        let followStatus = 'none';
        if (followRequest) {
          if (followRequest.follower.toString() === userId) {
            followStatus = followRequest.status;
          } else {
            followStatus = 'received';
          }
        }

        const finalMatch = match.toObject ? match.toObject() : match;
        return {
          ...finalMatch,
          followStatus
        };
      });

    console.log('🎯 Final recommendations count:', recommendations.length);
    res.json({ recommendations });
  } catch (error) {
    console.error('Recommendations error:', error);
    console.error('Error stack:', error.stack);

    // Return empty recommendations on any error
    res.json({
      recommendations: [],
      error: error.message
    });
  }
};

export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id).select('-password -embedding').lean();

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const debugEmbeddings = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId);
    const allUsers = await User.find({ _id: { $ne: userId } }).select('name hobbies embedding');

    const results = [];

    if (user.embedding && Array.isArray(user.embedding) && user.embedding.length > 0) {
      for (const otherUser of allUsers) {
        if (otherUser.embedding && Array.isArray(otherUser.embedding) && otherUser.embedding.length > 0) {
          const similarity = calculateCosineSimilarity(user.embedding, otherUser.embedding);
          const matchPercentage = Math.min(95, Math.max(60, Math.round(similarity * 100)));

          results.push({
            name: otherUser.name,
            hobbies: otherUser.hobbies,
            similarity: similarity,
            matchPercentage: matchPercentage
          });
        }
      }
    }

    res.json({
      currentUser: {
        name: user.name,
        hobbies: user.hobbies,
        hasEmbedding: !!user.embedding
      },
      matches: results.sort((a, b) => b.matchPercentage - a.matchPercentage)
    });
  } catch (error) {
    res.json({ error: error.message });
  }
};

export const getSharedHobbies = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user.userId;

    const currentUser = await User.findById(currentUserId);
    const targetUser = await User.findById(id);

    if (!currentUser || !targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const currentUserHobbies = currentUser.hobbies || [];
    const targetUserHobbies = targetUser.hobbies || [];

    const sharedHobbies = currentUserHobbies.filter(hobby =>
      targetUserHobbies.some(targetHobby =>
        targetHobby.toLowerCase().includes(hobby.toLowerCase()) ||
        hobby.toLowerCase().includes(targetHobby.toLowerCase())
      )
    );

    // 🚀 AI-POWERED MATCH PERCENTAGE using SpaCy + Pinecone
    let matchPercentage = 25; // Default fallback

    if (
      currentUser.embedding &&
      Array.isArray(currentUser.embedding) &&
      currentUser.embedding.length > 0 &&
      targetUser.embedding &&
      Array.isArray(targetUser.embedding) &&
      targetUser.embedding.length > 0
    ) {
      try {
        // Calculate cosine similarity between embeddings
        const similarity = calculateCosineSimilarity(currentUser.embedding, targetUser.embedding);
        matchPercentage = Math.min(95, Math.max(60, Math.round(similarity * 100)));
        console.log(`🤖 AI Match: ${currentUser.name} ↔ ${targetUser.name} = ${matchPercentage}%`);
      } catch (error) {
        console.error('❌ AI matching failed:', error.message);
        matchPercentage = 60;
      }
    } else {
      matchPercentage = 60; // Default if no embeddings
    }

    res.json({
      sharedHobbies,
      currentUserHobbies,
      targetUserHobbies,
      matchPercentage
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Regenerate embedding for current user
export const regenerateEmbedding = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.hobbies || user.hobbies.length === 0) {
      return res.status(400).json({ message: 'No hobbies found to generate embedding' });
    }

    const hobbiesText = user.hobbies.join(' ');
    const embedding = await generateEmbedding(hobbiesText);

    if (embedding && embedding.length > 0) {
      user.embedding = embedding;
      await user.save();

      // Update in Pinecone
      if (process.env.PINECONE_API_KEY) {
        try {
          await upsertUserEmbedding(userId, embedding, {
            userId: userId.toString(),
            hobbies: user.hobbies,
            name: user.name
          });
        } catch (error) {
          console.error('Pinecone update failed:', error.message);
        }
      }

      res.json({ message: 'Embedding regenerated successfully', embeddingLength: embedding.length });
    } else {
      res.status(500).json({ message: 'Failed to generate embedding' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Generate embeddings for all users who don't have them
export const generateMissingEmbeddings = async (req, res) => {
  try {
    const usersWithoutEmbeddings = await User.find({
      hobbies: { $exists: true, $ne: [] },
      $or: [
        { embedding: { $exists: false } },
        { embedding: null },
        { embedding: [] }
      ]
    });

    let processed = 0;
    let failed = 0;

    for (const user of usersWithoutEmbeddings) {
      try {
        const hobbiesText = user.hobbies.join(' ');
        const embedding = await generateEmbedding(hobbiesText);

        if (embedding && embedding.length > 0) {
          user.embedding = embedding;
          await user.save();

          // Store in Pinecone
          if (process.env.PINECONE_API_KEY) {
            try {
              await upsertUserEmbedding(user._id, embedding, {
                userId: user._id.toString(),
                hobbies: user.hobbies,
                name: user.name
              });
            } catch (error) {
              console.error(`Pinecone failed for user ${user.name}:`, error.message);
            }
          }

          processed++;
          console.log(`✅ Generated embedding for ${user.name}`);
        } else {
          failed++;
          console.log(`❌ Failed to generate embedding for ${user.name}`);
        }
      } catch (error) {
        failed++;
        console.error(`Error processing ${user.name}:`, error.message);
      }
    }

    res.json({
      message: 'Bulk embedding generation completed',
      totalUsers: usersWithoutEmbeddings.length,
      processed,
      failed
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Check embedding health for all users
export const checkEmbeddingHealth = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const usersWithHobbies = await User.countDocuments({ hobbies: { $exists: true, $ne: [] } });
    const usersWithEmbeddings = await User.countDocuments({
      embedding: { $exists: true, $ne: null, $ne: [] }
    });
    const usersWithBothHobbiesAndEmbeddings = await User.countDocuments({
      hobbies: { $exists: true, $ne: [] },
      embedding: { $exists: true, $ne: null, $ne: [] }
    });

    const missingEmbeddings = await User.find({
      hobbies: { $exists: true, $ne: [] },
      $or: [
        { embedding: { $exists: false } },
        { embedding: null },
        { embedding: [] }
      ]
    }).select('name hobbies');

    res.json({
      totalUsers,
      usersWithHobbies,
      usersWithEmbeddings,
      usersWithBothHobbiesAndEmbeddings,
      embeddingCoverage: usersWithHobbies > 0 ? ((usersWithBothHobbiesAndEmbeddings / usersWithHobbies) * 100).toFixed(2) + '%' : '0%',
      missingEmbeddings: missingEmbeddings.map(u => ({ name: u.name, hobbies: u.hobbies }))
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
