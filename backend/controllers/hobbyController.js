import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { generateEmbedding as getEmbedding } from '../utils/embeddings.js';
import { upsertUserEmbedding, findSimilarUsers } from '../utils/pinecone.js';

export const updateHobbiesAndGetRecommendations = async (req, res) => {
  try {
    const { hobbies } = req.body;
    const userId = req.user.userId;

    if (!hobbies || !Array.isArray(hobbies) || hobbies.length === 0) {
      return res.status(400).json({ message: 'Hobbies array is required' });
    }

    // Generate individual embeddings for each hobby
    const hobbyEmbeddings = [];
    for (const hobby of hobbies) {
      const embedding = await getEmbedding(hobby);
      if (embedding) {
        hobbyEmbeddings.push({ hobby, embedding });
      }
    }

    // Generate combined embedding for backward compatibility
    const hobbyText = hobbies.join(' ');
    const combinedEmbedding = await getEmbedding(hobbyText);

    // Update user hobbies and mark profile as complete
    const currentUser = await User.findByIdAndUpdate(userId, { 
      hobbies, 
      embedding: combinedEmbedding,
      hobbyEmbeddings,
      profileComplete: true
    }, { new: true });

    // Upsert embedding to Pinecone
    await upsertUserEmbedding(userId, embedding, { hobbies });

    // Find similar users
    const similarUserIds = await findSimilarUsers(embedding, 10, userId);

    // Fetch user profiles from MongoDB
    const recommendedUsers = await User.find(
      { _id: { $in: similarUserIds } },
      { password: 0, embedding: 0 }
    );

    // Create notifications for matched users and current user
    const io = req.app.get('io');
    
    // Notify existing users about new match
    for (const matchedUser of recommendedUsers) {
      const sharedHobbies = hobbies.filter(hobby => 
        matchedUser.hobbies.some(userHobby => 
          userHobby.toLowerCase().includes(hobby.toLowerCase()) || 
          hobby.toLowerCase().includes(userHobby.toLowerCase())
        )
      );

      if (sharedHobbies.length > 0) {
        // Create notification for matched user
        await new Notification({
          user_id: matchedUser._id,
          type: 'match',
          message: `${currentUser.name} shares your interests in ${sharedHobbies.join(', ')}`
        }).save();

        // Send real-time notification
        io.to(`user_${matchedUser._id}`).emit('new_notification', {
          type: 'match',
          message: `${currentUser.name} shares your interests in ${sharedHobbies.join(', ')}`,
          userId: userId,
          sharedHobbies
        });
      }
    }

    // Create notification for current user about matches
    if (recommendedUsers.length > 0) {
      await new Notification({
        user_id: userId,
        type: 'match',
        message: `Found ${recommendedUsers.length} users with similar interests!`
      }).save();
    }

    // Import the new matching function
    const { calculateHobbyMatchPercentage } = await import('../utils/pinecone.js');

    res.json({
      success: true,
      recommendations: recommendedUsers.map(user => {
        // Calculate match percentage using individual hobby embeddings
        const matchPercentage = currentUser.hobbyEmbeddings?.length && user.hobbyEmbeddings?.length 
          ? calculateHobbyMatchPercentage(currentUser.hobbyEmbeddings, user.hobbyEmbeddings)
          : Math.min(95, Math.max(60, Math.round(
              (hobbies.filter(hobby => 
                user.hobbies.some(userHobby => 
                  userHobby.toLowerCase().includes(hobby.toLowerCase()) || 
                  hobby.toLowerCase().includes(userHobby.toLowerCase())
                )
              ).length / Math.max(hobbies.length, user.hobbies.length)) * 100
            )));
        
        return {
          id: user._id,
          name: user.name,
          fullName: user.fullName || user.name,
          age: user.age,
          location: user.location,
          occupation: user.occupation,
          bio: user.bio,
          hobbies: user.hobbies,
          avatar: user.avatar,
          sharedHobbies: hobbies.filter(hobby => 
            user.hobbies.some(userHobby => 
              userHobby.toLowerCase().includes(hobby.toLowerCase()) || 
              hobby.toLowerCase().includes(userHobby.toLowerCase())
            )
          ),
          matchPercentage
        };
      })
    });

  } catch (error) {
    console.error('Hobby recommendation error:', error);
    res.status(500).json({ message: 'Failed to process hobbies and get recommendations' });
  }
};

export const getHobbyRecommendations = async (req, res) => {
  try {
    const userId = req.user.userId;
    const currentUser = await User.findById(userId);
    
    if (!currentUser.embedding) {
      return res.status(400).json({ message: 'Please add hobbies first' });
    }

    // Find similar users
    const similarUserIds = await findSimilarUsers(currentUser.embedding, 10, userId);

    // Fetch user profiles
    const recommendedUsers = await User.find(
      { _id: { $in: similarUserIds } },
      { password: 0, embedding: 0 }
    );

    // Import the new matching function
    const { calculateHobbyMatchPercentage } = await import('../utils/pinecone.js');

    res.json({
      success: true,
      recommendations: recommendedUsers.map(user => {
        // Calculate match percentage using individual hobby embeddings
        const matchPercentage = currentUser.hobbyEmbeddings?.length && user.hobbyEmbeddings?.length 
          ? calculateHobbyMatchPercentage(currentUser.hobbyEmbeddings, user.hobbyEmbeddings)
          : Math.min(95, Math.max(60, Math.round(
              (currentUser.hobbies.filter(hobby => 
                user.hobbies.some(userHobby => 
                  userHobby.toLowerCase().includes(hobby.toLowerCase()) || 
                  hobby.toLowerCase().includes(userHobby.toLowerCase())
                )
              ).length / Math.max(currentUser.hobbies.length, user.hobbies.length)) * 100
            )));
        
        return {
          id: user._id,
          name: user.name,
          fullName: user.fullName || user.name,
          age: user.age,
          location: user.location,
          occupation: user.occupation,
          bio: user.bio,
          hobbies: user.hobbies,
          avatar: user.avatar,
          sharedHobbies: currentUser.hobbies.filter(hobby => 
            user.hobbies.some(userHobby => 
              userHobby.toLowerCase().includes(hobby.toLowerCase()) || 
              hobby.toLowerCase().includes(userHobby.toLowerCase())
            )
          ),
          matchPercentage
        };
      })
    });

  } catch (error) {
    console.error('Get recommendations error:', error);
    res.status(500).json({ message: 'Failed to get recommendations' });
  }
};