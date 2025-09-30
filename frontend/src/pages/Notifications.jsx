import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, MessageCircle, Bell, Check, X } from 'lucide-react';
import NotificationIcon from '../components/NotificationIcon';
import api from '../utils/api';

const Notifications = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
    fetchPendingRequests();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/notifications');
      setNotifications(response.data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingRequests = async () => {
    try {
      const response = await api.get('/follow/pending-requests');
      setPendingRequests(response.data.requests || []);
    } catch (error) {
      console.error('Error fetching pending requests:', error);
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'match':
        return <Heart className="text-red-500" size={20} />;
      case 'chat_request':
        return <MessageCircle className="text-green-500" size={20} />;
      case 'system':
        return <Bell className="text-orange-500" size={20} />;
      default:
        return <Bell className="text-orange-500" size={20} />;
    }
  };

  const handleNotificationClick = async (notification) => {
    try {
      await api.post('/notifications/read', { id: notification._id });
      setNotifications(prev => 
        prev.map(n => n._id === notification._id ? { ...n, read_status: true } : n)
      );

      if (notification.type === 'match') {
        navigate('/matches');
      } else if (notification.type === 'chat_request') {
        navigate('/chat');
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleAcceptChatRequest = async (notificationId) => {
    try {
      const notification = notifications.find(n => n._id === notificationId);
      
      if (notification.follower_id) {
        await api.post('/follow/accept', { followerId: notification.follower_id._id || notification.follower_id });
        
        // Remove notification from UI immediately
        setNotifications(prev => prev.filter(n => n._id !== notificationId));
        
        // Update dashboard stats
        window.dispatchEvent(new CustomEvent('refreshDashboardStats'));
      }
    } catch (error) {
      console.error('Error accepting chat request:', error);
    }
  };

  const handleDeclineChatRequest = async (notificationId) => {
    try {
      const notification = notifications.find(n => n._id === notificationId);
      
      // Remove notification from UI immediately
      setNotifications(prev => prev.filter(n => n._id !== notificationId));
      
      if (notification.follower_id) {
        await api.post('/follow/reject', { followerId: notification.follower_id._id || notification.follower_id });
      }
    } catch (error) {
      console.error('Error declining chat request:', error);
    }
  };

  const handleAcceptPendingRequest = async (followerId) => {
    try {
      await api.post('/follow/accept', { followerId });
      setPendingRequests(prev => prev.filter(req => req._id !== followerId));
      fetchNotifications();
    } catch (error) {
      console.error('Error accepting pending request:', error);
    }
  };

  const handleDeclinePendingRequest = async (followerId) => {
    try {
      await api.post('/follow/reject', { followerId });
      setPendingRequests(prev => prev.filter(req => req._id !== followerId));
      // Refresh notifications to update counts
      fetchNotifications();
    } catch (error) {
      console.error('Error declining pending request:', error);
    }
  };

  const handleBlockUser = async (userId) => {
    try {
      // Remove from UI immediately
      setPendingRequests(prev => prev.filter(req => req._id !== userId));
      setNotifications(prev => prev.filter(n => n.follower_id?._id !== userId));
      
      await api.post('/block', { userId });
      
      // Dispatch event to update dashboard stats
      window.dispatchEvent(new CustomEvent('refreshDashboardStats'));
    } catch (error) {
      console.error('Error blocking user:', error);
    }
  };

  const unreadCount = notifications.filter(n => !n.read_status).length;

  const getTitle = (type) => {
    switch (type) {
      case 'match': return 'New Match!';
      case 'chat_request': return 'Chat Request';
      case 'system': return 'System Notification';
      default: return 'Notification';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#E8FFD7] via-[#93DA97] to-[#5E936C] p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3E5F44] mx-auto mb-4"></div>
          <p className="text-[#3E5F44] font-medium">Loading notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E8FFD7] via-[#93DA97] to-[#5E936C] p-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <NotificationIcon count={unreadCount} size={32} className="text-blue-600" />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-[#3E5F44] to-[#5E936C] bg-clip-text text-transparent">
              Notifications
            </h1>
          </div>
          {unreadCount > 0 && (
            <div className="bg-gradient-to-r from-[#3E5F44] to-[#5E936C] text-white px-3 py-1 rounded-full text-sm font-semibold shadow-lg">
              {unreadCount} new
            </div>
          )}
        </div>
        
        <div className="space-y-4">
          {/* Regular Notifications */}
          {notifications.map(notification => (
            <div
              key={notification._id}
              className={`bg-[#E8FFD7]/90 backdrop-blur-sm rounded-xl shadow-lg border transition-all duration-200 hover:shadow-xl hover:scale-[1.02] ${
                !notification.read_status ? 'border-l-4 border-l-[#5E936C] shadow-[#93DA97]/30' : 'border-gray-200'
              }`}
            >
              <div className="p-6">
                {/* Follow Request Notifications with Profile Card */}
                {notification.type === 'chat_request' && notification.follower_id ? (
                  <div className="flex items-start space-x-4">
                    {/* Profile Photo */}
                    <div className="flex-shrink-0">
                      <div className="w-16 h-16 bg-gradient-to-br from-[#5E936C] to-[#93DA97] rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg">
                        {notification.follower_id.profile_picture ? (
                          <img 
                            src={notification.follower_id.profile_picture} 
                            alt={notification.follower_id.name}
                            className="w-16 h-16 rounded-full object-cover"
                          />
                        ) : (
                          notification.follower_id.name?.charAt(0)?.toUpperCase() || 'U'
                        )}
                      </div>
                    </div>
                    
                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2">
                        <MessageCircle className="text-green-500" size={16} />
                        <h3 className="font-bold text-lg text-gray-900">Follow Request</h3>
                        {!notification.read_status && (
                          <div className="w-2 h-2 bg-gradient-to-r from-[#5E936C] to-[#93DA97] rounded-full animate-pulse"></div>
                        )}
                      </div>
                      
                      <h4 className="font-semibold text-xl text-gray-800 mb-1">{notification.follower_id.name}</h4>
                      
                      {notification.follower_id.age && notification.follower_id.location && (
                        <p className="text-gray-600 mb-1">{notification.follower_id.age} • {notification.follower_id.location}</p>
                      )}
                      
                      {notification.follower_id.occupation && (
                        <p className="text-gray-600 mb-2">{notification.follower_id.occupation}</p>
                      )}
                      
                      {notification.follower_id.bio && (
                        <p className="text-gray-700 mb-3 text-sm italic">"{notification.follower_id.bio}"</p>
                      )}
                      
                      {notification.follower_id.hobbies && notification.follower_id.hobbies.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {notification.follower_id.hobbies.slice(0, 3).map((hobby, index) => (
                            <span key={index} className="bg-[#93DA97]/50 text-[#3E5F44] px-2 py-1 rounded-full text-xs font-medium">
                              {hobby}
                            </span>
                          ))}
                          {notification.follower_id.hobbies.length > 3 && (
                            <span className="text-gray-500 text-xs">+{notification.follower_id.hobbies.length - 3} more</span>
                          )}
                        </div>
                      )}
                      
                      <p className="text-sm text-gray-500">{formatTime(notification.timestamp)}</p>
                    </div>
                  </div>
                ) : (
                  /* Regular Notification Layout */
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                          {getIcon(notification.type)}
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          {getIcon(notification.type)}
                          <h3 className="font-semibold text-gray-900">{getTitle(notification.type)}</h3>
                          {!notification.read_status && (
                            <div className="w-2 h-2 bg-gradient-to-r from-[#5E936C] to-[#93DA97] rounded-full animate-pulse"></div>
                          )}
                        </div>
                        <p className="text-gray-600 mb-2">{notification.message}</p>
                        <p className="text-sm text-gray-500">{formatTime(notification.timestamp)}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action buttons for chat requests */}
                {notification.type === 'chat_request' && !notification.read_status && (
                  <div className="flex space-x-3 mt-4 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => handleAcceptChatRequest(notification._id)}
                      className="flex items-center space-x-2 bg-gradient-to-r from-[#5E936C] to-[#93DA97] hover:from-[#3E5F44] hover:to-[#5E936C] text-white px-6 py-2 rounded-lg transition-all duration-200 shadow-lg font-medium"
                    >
                      <Check size={16} />
                      <span>Accept</span>
                    </button>
                    <button
                      onClick={() => handleDeclineChatRequest(notification._id)}
                      className="flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-2 rounded-lg transition-all duration-200 font-medium"
                    >
                      <X size={16} />
                      <span>Ignore</span>
                    </button>
                    <button
                      onClick={() => handleBlockUser(notification.follower_id._id)}
                      className="flex items-center space-x-2 bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg transition-all duration-200 font-medium"
                    >
                      <X size={16} />
                      <span>Block</span>
                    </button>
                  </div>
                )}

                {/* Click to view for matches and system notifications */}
                {(notification.type === 'match' || notification.type === 'system') && (
                  <button
                    onClick={() => handleNotificationClick(notification)}
                    className="mt-4 text-[#3E5F44] hover:text-[#5E936C] font-medium transition-colors duration-200"
                  >
                    {notification.type === 'match' ? 'View Match' : 'View Details'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {notifications.length === 0 && (
          <div className="text-center py-12">
            <Bell className="mx-auto text-gray-400 mb-4" size={48} />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No notifications yet</h3>
            <p className="text-gray-500">We'll notify you when something interesting happens!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;