import Chat from '../models/Chat.js';
import User from '../models/User.js';
import { getWelcomeMessage } from './welcomeService.js';

export const createWelcomeChat = async (userId, userName) => {
  try {
    // Find or create AI bot
    let aiBot = await User.findOne({ email: 'aibot@likemind.com' });
    
    if (!aiBot) {
      aiBot = new User({
        name: 'LikeMind AI',
        email: 'aibot@likemind.com',
        passwordHash: '$2a$12$dummy.hash.for.ai.bot',
        isVerified: true,
        isFirstLogin: false
      });
      await aiBot.save();
    }

    // Check if welcome chat already exists
    const existingChat = await Chat.findOne({
      participants: { $all: [userId, aiBot._id] }
    });

    if (existingChat) {
      return existingChat;
    }

    // Create welcome message
    const welcomeMsg = getWelcomeMessage(userName);
    
    // Create new chat with welcome message
    const welcomeChat = new Chat({
      participants: [userId, aiBot._id],
      messages: [{
        sender: aiBot._id,
        text: welcomeMsg.message,
        timestamp: welcomeMsg.timestamp,
        read: false
      }],
      lastMessage: welcomeMsg.message.substring(0, 100) + '...',
      lastMessageTime: welcomeMsg.timestamp
    });

    await welcomeChat.save();
    return welcomeChat;
    
  } catch (error) {
    console.error('Error creating welcome chat:', error);
    throw error;
  }
};