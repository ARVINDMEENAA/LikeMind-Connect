export const getWelcomeMessage = (userName) => {
  return {
    sender: 'LikeMind AI',
    message: `🎉 Welcome to LikeMind Connect, ${userName}! 

I'm your AI assistant here to help you make meaningful connections! Here's what you can do:

🔍 **Find Your Tribe**: Discover people who share your hobbies and interests
💬 **Smart Matching**: Our AI matches you with like-minded individuals  
📱 **Real-time Chat**: Connect instantly with your matches
🎯 **Hobby-based Connections**: Build relationships around shared passions
🔔 **Stay Updated**: Get notifications for new matches and messages

Ready to start your journey? Complete your profile and let's find your perfect connections! 🚀`,
    timestamp: new Date(),
    isWelcomeMessage: true
  };
};