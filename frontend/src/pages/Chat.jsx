import React, { useState, useEffect } from 'react';
import { useSearchParams, useParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import ChatBox from '../components/ChatBox';
import { ArrowLeft, Trash2, MoreVertical } from 'lucide-react';
import ChatIcon from '../components/ChatIcon';
import api from '../utils/api';
import socketService from '../utils/socket';

const Chat = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const { userId: paramUserId } = useParams();
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [matches, setMatches] = useState([]);
  const [messages, setMessages] = useState({});
  const [unreadCounts, setUnreadCounts] = useState({});
  const [showChatMenu, setShowChatMenu] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // AI Assistant - Always at top
  const aiAssistant = {
    id: 'ai-assistant',
    _id: 'ai-assistant',
    name: '🤖 AI Assistant',
    lastMessage: 'Ask me anything!',
    lastMessageTime: new Date().toISOString(),
    isAI: true
  };

  // Load matches from API
  useEffect(() => {
    fetchMatches();
  }, []);

  // Handle URL parameter for direct chat
  useEffect(() => {
    const userId = paramUserId || searchParams.get('userId');
    console.log('URL userId:', userId, 'Matches length:', matches.length);
    if (userId) {
      // First check if user already exists in matches
      const targetUser = matches.find(match => match.id === userId || match._id === userId);
      console.log('Target user found in matches:', targetUser);
      if (targetUser) {
        setSelectedMatch(targetUser);
      } else {
        // If user not in matches, fetch user info and add to matches
        console.log('User not in matches, fetching...');
        fetchUserForChat(userId);
      }
    }
  }, [searchParams, matches]);

  // Separate effect to handle initial URL parameter when matches is empty
  useEffect(() => {
    const userId = paramUserId || searchParams.get('userId');
    console.log('Initial URL check - userId:', userId, 'matches empty:', matches.length === 0);
    if (userId && matches.length === 0) {
      console.log('Fetching user for empty matches...');
      fetchUserForChat(userId);
    }
  }, [searchParams]);

  const fetchMatches = async () => {
    try {
      const response = await api.get('/chats');
      const chats = response.data || [];
      
      // Remove duplicates based on partner ID
      const uniqueChats = chats.filter((chat, index, self) => 
        index === self.findIndex(c => c.partner._id === chat.partner._id)
      );
      
      const formattedMatches = uniqueChats.map(chat => ({
        id: chat.partner._id,
        _id: chat.partner._id,
        name: chat.partner.name,
        profilePhoto: chat.partner.profile_picture || chat.partner.avatar,
        lastMessage: chat.lastMessage,
        lastMessageTime: chat.lastMessageTime
      }));
      
      // Always put AI Assistant at top, then sort others by last message time
      const sortedMatches = formattedMatches.sort((a, b) => 
        new Date(b.lastMessageTime) - new Date(a.lastMessageTime)
      );
      setMatches([aiAssistant, ...sortedMatches]);
      
      // Set initial unread counts from server
      const initialUnreadCounts = {};
      uniqueChats.forEach(chat => {
        initialUnreadCounts[chat.partner._id] = chat.unreadCount || 0;
      });
      setUnreadCounts(initialUnreadCounts);
      
      // Update navbar count
      const totalUnread = Object.values(initialUnreadCounts).reduce((sum, count) => sum + count, 0);
      // Emit event to update navbar
      window.dispatchEvent(new CustomEvent('updateUnreadCount', { detail: totalUnread }));
    } catch (error) {
      console.error('Error fetching matches:', error);
      // Even if no chats, show AI Assistant
      setMatches([aiAssistant]);
    }
  };

  const fetchUserForChat = async (userId) => {
    try {
      // Check if user already exists in matches to prevent duplicates
      const existingMatch = matches.find(match => match.id === userId || match._id === userId);
      if (existingMatch) {
        setSelectedMatch(existingMatch);
        return;
      }
      
      const response = await api.get(`/user/${userId}`);
      const user = response.data.user;
      const chatUser = {
        id: user._id,
        _id: user._id,
        name: user.fullName || user.name,
        profilePhoto: user.profile_picture || user.avatar,
        lastMessage: 'Start a conversation',
        lastMessageTime: new Date().toISOString()
      };
      
      setMatches(prev => {
        // Double check to prevent duplicates
        const exists = prev.find(match => match.id === userId || match._id === userId);
        if (exists) return prev;
        return [chatUser, ...prev];
      });
      setSelectedMatch(chatUser);
    } catch (error) {
      console.error('Error fetching user for chat:', error);
    }
  };

  // Listen for file upload events
  useEffect(() => {
    const handleNewFileMessage = (event) => {
      const { matchId, message } = event.detail;
      if (matchId === selectedMatch?.id) {
        setMessages(prev => ({
          ...prev,
          [matchId]: [...(prev[matchId] || []), message]
        }));
      }
    };
    
    window.addEventListener('newFileMessage', handleNewFileMessage);
    return () => window.removeEventListener('newFileMessage', handleNewFileMessage);
  }, [selectedMatch]);

  // Initialize Socket.io connection
  useEffect(() => {
    if (user?._id) {
      socketService.connect(user._id);
      
      // Listen for new messages
      socketService.onReceiveMessage((data) => {
        const { senderId, receiverId, message, timestamp, messageType, fileUrl, fileName } = data;
        const chatPartnerId = senderId === user._id ? receiverId : senderId;
        
        const newMessage = {
          id: Date.now(),
          text: message,
          message_text: message,
          message_type: messageType || 'text',
          file_url: fileUrl,
          file_name: fileName,
          senderId: senderId,
          from_user_id: { _id: senderId },
          timestamp: timestamp
        };
        
        setMessages(prev => ({
          ...prev,
          [chatPartnerId]: [...(prev[chatPartnerId] || []), newMessage]
        }));

        // Update last message in matches list but keep AI Assistant at top
        setMatches(prev => {
          const updated = prev.map(match => 
            match.id === chatPartnerId 
              ? { ...match, lastMessage: message, lastMessageTime: timestamp }
              : match
          );
          // Keep AI Assistant at top, sort others by time
          const aiAssistant = updated.find(m => m.id === 'ai-assistant');
          const others = updated.filter(m => m.id !== 'ai-assistant').sort((a, b) => 
            new Date(b.lastMessageTime) - new Date(a.lastMessageTime)
          );
          return aiAssistant ? [aiAssistant, ...others] : others;
        });

        // Update unread count only for received messages
        if (senderId !== user._id) {
          if (selectedMatch?.id !== chatPartnerId) {
            // Increment unread count for this specific chat
            setUnreadCounts(prev => {
              const newCounts = {
                ...prev,
                [chatPartnerId]: (prev[chatPartnerId] || 0) + 1
              };
              // Update navbar count
              const totalUnread = Object.values(newCounts).reduce((sum, count) => sum + count, 0);
              window.dispatchEvent(new CustomEvent('updateUnreadCount', { detail: totalUnread }));
              return newCounts;
            });
          } else {
            // If viewing this chat, mark as read immediately
            markMessagesAsRead(chatPartnerId);
          }
        }
      });
    }
    
    return () => {
      socketService.removeAllListeners();
    };
  }, [user, selectedMatch]);

  // Load messages for selected match
  useEffect(() => {
    if (selectedMatch && user?._id) {
      // Get current unread count before clearing
      const currentUnreadCount = unreadCounts[selectedMatch.id] || 0;
      
      // Mark messages as read when opening chat
      setUnreadCounts(prev => {
        const newCounts = { ...prev, [selectedMatch.id]: 0 };
        // Update navbar count
        const totalUnread = Object.values(newCounts).reduce((sum, count) => sum + count, 0);
        window.dispatchEvent(new CustomEvent('updateUnreadCount', { detail: totalUnread }));
        return newCounts;
      });
      markMessagesAsRead(selectedMatch.id);
      
      // Join private room for real-time messaging
      socketService.joinPrivateRoom(user._id, selectedMatch.id);
      
      if (!messages[selectedMatch.id]) {
        fetchMessages(selectedMatch.id);
      }
    }
    
    return () => {
      if (selectedMatch && user?._id) {
        socketService.leavePrivateRoom(user._id, selectedMatch.id);
      }
    };
  }, [selectedMatch, user]);

  const markMessagesAsRead = async (senderId) => {
    try {
      await api.post('/mark-read', { senderId });
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const fetchMessages = async (matchId) => {
    // Load AI messages from localStorage
    if (matchId === 'ai-assistant') {
      const aiMessages = loadAIMessages();
      setMessages(prev => ({ ...prev, [matchId]: aiMessages }));
      return;
    }
    
    try {
      const response = await api.get(`/chat/${matchId}`);
      const formattedMessages = (response.data || []).map(msg => ({
        id: msg._id,
        text: msg.message_text,
        message_text: msg.message_text,
        message_type: msg.message_type || 'text',
        file_url: msg.file_url,
        file_name: msg.file_name,
        senderId: msg.from_user_id._id,
        from_user_id: msg.from_user_id,
        timestamp: msg.timestamp,
        edited: msg.edited
      }));
      setMessages(prev => ({ ...prev, [matchId]: formattedMessages }));
    } catch (error) {
      console.error('Error fetching messages:', error);
      setMessages(prev => ({ ...prev, [matchId]: [] }));
    }
  };

  const handleSendMessage = async (matchId, messageText) => {
    // Handle AI Assistant chat
    if (matchId === 'ai-assistant') {
      return handleAIMessage(messageText);
    }
    
    const tempId = `temp_${Date.now()}_${Math.random()}`;
    const tempMessage = {
      id: tempId,
      text: messageText,
      senderId: user?._id,
      timestamp: new Date().toISOString(),
      isTemp: true
    };

    // Add message locally for immediate UI update
    setMessages(prev => ({
      ...prev,
      [matchId]: [...(prev[matchId] || []), tempMessage]
    }));

    try {
      // Send message via API
      const response = await api.post('/chat', {
        receiverId: matchId,
        message: messageText
      });

      // Replace temp message with server response
      const serverMessage = {
        id: response.data.data._id,
        text: response.data.data.message_text,
        message_text: response.data.data.message_text,
        message_type: response.data.data.message_type || 'text',
        file_url: response.data.data.file_url,
        file_name: response.data.data.file_name,
        senderId: user?._id,
        from_user_id: { _id: user?._id },
        timestamp: response.data.data.timestamp
      };
      
      console.log('Server response:', response.data);
      console.log('Server message:', serverMessage);
      
      setMessages(prev => ({
        ...prev,
        [matchId]: (prev[matchId] || []).map(msg => 
          msg.id === tempId ? serverMessage : msg
        )
      }));

      // Update matches list but keep AI Assistant at top
      setMatches(prev => {
        const updated = prev.map(match => 
          match.id === matchId 
            ? { ...match, lastMessage: messageText, lastMessageTime: response.data.timestamp }
            : match
        );
        // Keep AI Assistant at top, sort others by time
        const aiAssistant = updated.find(m => m.id === 'ai-assistant');
        const others = updated.filter(m => m.id !== 'ai-assistant').sort((a, b) => 
          new Date(b.lastMessageTime) - new Date(a.lastMessageTime)
        );
        return aiAssistant ? [aiAssistant, ...others] : others;
      });

      // Send via socket if available
      if (socketService.isConnected) {
        socketService.sendPrivateMessage(user._id, matchId, messageText);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Remove failed temp message
      setMessages(prev => ({
        ...prev,
        [matchId]: (prev[matchId] || []).filter(msg => msg.id !== tempId)
      }));
    }
  };
  
  const saveAIMessages = (messages) => {
    localStorage.setItem(`ai-messages-${user?._id}`, JSON.stringify(messages));
  };
  
  const loadAIMessages = () => {
    const saved = localStorage.getItem(`ai-messages-${user?._id}`);
    return saved ? JSON.parse(saved) : [];
  };

  const handleAIMessage = async (messageText) => {
    const userMessage = {
      id: `user_${Date.now()}`,
      text: messageText,
      senderId: user?._id,
      timestamp: new Date().toISOString(),
      message_type: 'text'
    };
    
    // Add user message
    const updatedMessages = [...(messages['ai-assistant'] || []), userMessage];
    setMessages(prev => ({
      ...prev,
      'ai-assistant': updatedMessages
    }));
    saveAIMessages(updatedMessages);
    
    setAiLoading(true);
    
    try {
      const response = await api.post('/chat/ai', {
        prompt: messageText,
        receiverId: 'ai-assistant'
      });
      
      const aiMessage = {
        id: `ai_${Date.now()}`,
        text: response.data.data.message_text,
        message_text: response.data.data.message_text,
        message_type: 'ai',
        senderId: 'ai-assistant',
        from_user_id: { _id: 'ai-assistant', name: '🤖 AI Assistant' },
        timestamp: new Date().toISOString()
      };
      
      const finalMessages = [...updatedMessages, aiMessage];
      setMessages(prev => ({
        ...prev,
        'ai-assistant': finalMessages
      }));
      saveAIMessages(finalMessages);
      
      // Update AI Assistant last message (AI stays at top always)
      setMatches(prev => {
        const updated = prev.map(match => 
          match.id === 'ai-assistant'
            ? { ...match, lastMessage: response.data.data.message_text.substring(0, 50) + '...', lastMessageTime: new Date().toISOString() }
            : match
        );
        // Ensure AI Assistant stays at top
        const aiAssistant = updated.find(m => m.id === 'ai-assistant');
        const others = updated.filter(m => m.id !== 'ai-assistant');
        return aiAssistant ? [aiAssistant, ...others] : others;
      });
      
    } catch (error) {
      console.error('AI Error:', error);
      const errorMessage = {
        id: `ai_error_${Date.now()}`,
        text: 'Sorry, I\'m having trouble responding right now. Please try again!',
        message_type: 'ai',
        senderId: 'ai-assistant',
        from_user_id: { _id: 'ai-assistant', name: '🤖 AI Assistant' },
        timestamp: new Date().toISOString()
      };
      
      const finalMessages = [...updatedMessages, errorMessage];
      setMessages(prev => ({
        ...prev,
        'ai-assistant': finalMessages
      }));
      saveAIMessages(finalMessages);
    } finally {
      setAiLoading(false);
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = (now - date) / (1000 * 60);
    const diffInHours = diffInMinutes / 60;
    const diffInDays = diffInHours / 24;
    
    if (diffInMinutes < 1) {
      return 'now';
    } else if (diffInMinutes < 60) {
      return `${Math.floor(diffInMinutes)}m`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h`;
    } else if (diffInDays < 7) {
      return `${Math.floor(diffInDays)}d`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const deleteChat = async (matchId) => {
    // Prevent deleting AI Assistant
    if (matchId === 'ai-assistant') {
      alert('AI Assistant cannot be deleted!');
      setShowChatMenu(null);
      return;
    }
    
    if (window.confirm('Delete this entire chat? This cannot be undone.')) {
      try {
        await api.delete(`/chat/${matchId}`);
        setMatches(prev => prev.filter(match => match.id !== matchId));
        setMessages(prev => {
          const newMessages = { ...prev };
          delete newMessages[matchId];
          return newMessages;
        });
        if (selectedMatch?.id === matchId) {
          setSelectedMatch(null);
        }
        setShowChatMenu(null);
      } catch (error) {
        console.error('Error deleting chat:', error);
        alert('Failed to delete chat');
      }
    }
  };

  return (
    <div className="fixed inset-0 flex bg-gradient-to-br from-[#E8FFD7] via-[#93DA97] to-[#5E936C] z-10">
      {/* Left Sidebar - Match List */}
      <div className={`${selectedMatch ? 'hidden md:block' : 'block'} w-full md:w-96 bg-[#E8FFD7]/95 backdrop-blur-sm border-r shadow-lg`}>
        <div className="p-6 border-b bg-gradient-to-r from-[#3E5F44] via-[#5E936C] to-[#93DA97] shadow-lg">
          <div className="flex items-center space-x-3 mb-4">
            <ChatIcon count={Object.values(unreadCounts).reduce((sum, count) => sum + count, 0)} size={28} className="text-white" />
            <h1 className="text-2xl font-bold text-white">
              Messages
            </h1>
          </div>
          <div className="relative">
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-white/20 text-white placeholder-white/70 border border-white/30 focus:border-white focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-white/70 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>
        </div>
        <div className="overflow-y-auto h-full">
          {matches.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <div className="text-4xl mb-4">💬</div>
              <p>No matches yet. Start swiping to find connections!</p>
            </div>
          ) : (
            matches.filter(match => 
              match.name.toLowerCase().includes(searchQuery.toLowerCase())
            ).map(match => (
            <div
              key={match.id}
              className={`p-4 border-b hover:bg-gradient-to-r hover:from-[#E8FFD7] hover:to-[#93DA97]/30 transition-all duration-200 relative ${
                selectedMatch?.id === match.id ? 'bg-gradient-to-r from-[#E8FFD7] to-[#93DA97]/30 border-l-4 border-l-[#5E936C] shadow-sm' : ''
              }`}
            >
              <div className="flex items-center w-full">
                <div 
                  className="flex items-center flex-1 min-w-0 cursor-pointer pr-2"
                  onClick={() => setSelectedMatch(match)}
                >
                  <div className="w-12 h-12 rounded-full mr-3 shadow-lg flex-shrink-0 overflow-hidden">
                    {match.profilePhoto ? (
                      <img 
                        src={match.profilePhoto} 
                        alt={match.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-r from-[#3E5F44] via-[#5E936C] to-[#93DA97] flex items-center justify-center text-[#E8FFD7] font-semibold">
                        {match.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-gray-900 truncate pr-2">{match.name}</h3>
                      <span className="text-xs text-gray-500 flex-shrink-0">
                        {formatTime(match.lastMessageTime)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 truncate">{match.lastMessage}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 flex-shrink-0 ml-2">
                  {unreadCounts[match.id] > 0 && (
                    <div className="w-5 h-5 bg-gradient-to-r from-[#5E936C] to-[#93DA97] text-white text-xs rounded-full flex items-center justify-center shadow-lg animate-pulse">
                      {unreadCounts[match.id]}
                    </div>
                  )}
                  {!match.isAI && (
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowChatMenu(showChatMenu === match.id ? null : match.id);
                        }}
                        className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                      >
                        <MoreVertical size={16} className="text-gray-500" />
                      </button>
                      {showChatMenu === match.id && (
                        <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border py-1 z-20 min-w-[120px]">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteChat(match.id);
                            }}
                            className="flex items-center space-x-2 px-3 py-2 text-red-600 hover:bg-red-50 w-full text-left text-sm"
                          >
                            <Trash2 size={14} />
                            <span>Delete Chat</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
          )}
        </div>
      </div>

      {/* Right Side - ChatBox for Desktop */}
      <div className="flex-1 hidden md:flex flex-col">
        <ChatBox 
          selectedMatch={selectedMatch} 
          messages={messages[selectedMatch?.id] || []} 
          onSendMessage={handleSendMessage}
          onDeleteMessage={(messageId) => {
            console.log('onDeleteMessage called with:', messageId, 'selectedMatch:', selectedMatch?.id);
            if (selectedMatch) {
              // Handle both single message ID and array of message IDs
              const messageIds = Array.isArray(messageId) ? messageId : [messageId];
              console.log('Processing messageIds:', messageIds);
              
              setMessages(prev => {
                const currentMessages = prev[selectedMatch.id] || [];
                console.log('Current messages count:', currentMessages.length);
                
                const filteredMessages = currentMessages.filter(msg => {
                  const msgId = msg.id || msg._id;
                  const shouldKeep = !messageIds.includes(msgId);
                  if (!shouldKeep) {
                    console.log('Removing message:', msgId);
                  }
                  return shouldKeep;
                });
                
                console.log('Filtered messages count:', filteredMessages.length);
                
                return {
                  ...prev,
                  [selectedMatch.id]: filteredMessages
                };
              });
            }
          }}
        />
      </div>

      {/* Mobile ChatBox Overlay */}
      {selectedMatch && (
        <div className="fixed inset-0 bg-[#E8FFD7] z-50 md:hidden">
          <div className="flex items-center p-4 border-b bg-gradient-to-r from-[#3E5F44] to-[#5E936C] shadow-lg">
            <button
              onClick={() => setSelectedMatch(null)}
              className="mr-3 p-2 text-white hover:bg-white/20 rounded-full transition-colors duration-200"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="w-10 h-10 rounded-full mr-3 shadow-lg overflow-hidden">
              {selectedMatch.profilePhoto ? (
                <img 
                  src={selectedMatch.profilePhoto} 
                  alt={selectedMatch.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-[#E8FFD7]/30 flex items-center justify-center text-[#3E5F44] font-semibold">
                  {selectedMatch.name.charAt(0)}
                </div>
              )}
            </div>
            <h2 className="font-semibold text-white">{selectedMatch.name}</h2>
          </div>
          <div className="h-full">
            <ChatBox 
              selectedMatch={selectedMatch} 
              messages={messages[selectedMatch.id] || []} 
              onSendMessage={handleSendMessage}
              onDeleteMessage={(messageId) => {
                console.log('Mobile onDeleteMessage called with:', messageId, 'selectedMatch:', selectedMatch?.id);
                if (selectedMatch) {
                  // Handle both single message ID and array of message IDs
                  const messageIds = Array.isArray(messageId) ? messageId : [messageId];
                  console.log('Mobile processing messageIds:', messageIds);
                  
                  setMessages(prev => {
                    const currentMessages = prev[selectedMatch.id] || [];
                    console.log('Mobile current messages count:', currentMessages.length);
                    
                    const filteredMessages = currentMessages.filter(msg => {
                      const msgId = msg.id || msg._id;
                      const shouldKeep = !messageIds.includes(msgId);
                      if (!shouldKeep) {
                        console.log('Mobile removing message:', msgId);
                      }
                      return shouldKeep;
                    });
                    
                    console.log('Mobile filtered messages count:', filteredMessages.length);
                    
                    return {
                      ...prev,
                      [selectedMatch.id]: filteredMessages
                    };
                  });
                }
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Chat;