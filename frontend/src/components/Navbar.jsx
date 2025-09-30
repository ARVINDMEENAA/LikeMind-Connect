import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, User, LogOut, ChevronDown } from 'lucide-react';
import NotificationIcon from './NotificationIcon';
import ChatIcon from './ChatIcon';
import { useAuth } from '../hooks/useAuth';
import api from '../utils/api';
import socketService from '../utils/socket';

const Navbar = () => {
  const navigate = useNavigate();
  const { user, logout: authLogout, isAuthenticated } = useAuth();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [dashboardNotificationCount, setDashboardNotificationCount] = useState(0);

  // Listen for unread count updates from Chat component
  useEffect(() => {
    const handleUnreadUpdate = (event) => {
      setUnreadMessages(event.detail);
    };
    
    window.addEventListener('updateUnreadCount', handleUnreadUpdate);
    
    return () => {
      window.removeEventListener('updateUnreadCount', handleUnreadUpdate);
    };
  }, []);

  // Fetch unread counts and setup socket listeners
  useEffect(() => {
    const fetchUnreadCounts = async () => {
      if (isAuthenticated()) {
        try {
          // Fetch unread notifications
          const notificationsRes = await api.get('/notifications');
          const unreadNotifs = notificationsRes.data.filter(notif => !notif.read_status).length;
          
          // Fetch pending follow requests
          const pendingRes = await api.get('/follow/pending-requests');
          const pendingCount = pendingRes.data.count || 0;
          
          // Use only unread notifications since follow requests are already in notifications
          const totalNotificationCount = unreadNotifs;
          setUnreadNotifications(totalNotificationCount);
          setDashboardNotificationCount(totalNotificationCount);
          
          // Dispatch event for dashboard to use same count
          window.dispatchEvent(new CustomEvent('updateDashboardNotificationCount', { detail: totalNotificationCount }));

          // Fetch unread messages
          const chatsRes = await api.get('/chats');
          let totalUnreadMessages = 0;
          chatsRes.data.forEach(chat => {
            totalUnreadMessages += chat.unreadCount || 0;
          });
          setUnreadMessages(totalUnreadMessages);
        } catch (error) {
          console.error('Error fetching unread counts:', error);
        }
      }
    };

    let interval;
    
    if (isAuthenticated()) {
      fetchUnreadCounts();
      
      // Set up periodic refresh every 10 seconds
      interval = setInterval(fetchUnreadCounts, 10000);
      
      // Connect socket
      socketService.connect(user?._id);
      
      // Listen for new messages
      socketService.onReceiveMessage((data) => {
        // Only increment if message is for current user
        if (data.receiverId === user?._id) {
          setUnreadMessages(prev => prev + 1);
        }
      });
      
      // Listen for new notifications
      socketService.socket?.on('new_notification', () => {
        setUnreadNotifications(prev => {
          const newCount = prev + 1;
          window.dispatchEvent(new CustomEvent('updateDashboardNotificationCount', { detail: newCount }));
          return newCount;
        });
      });
      
      // Listen for notification read
      socketService.socket?.on('notification_read', () => {
        fetchUnreadCounts(); // Refresh counts
      });
      
      // Listen for dashboard updates
      socketService.socket?.on('dashboard_update', (data) => {
        if (data.notifications !== undefined) {
          setUnreadNotifications(data.notifications + (data.pendingRequests || 0));
          window.dispatchEvent(new CustomEvent('updateDashboardNotificationCount', { detail: data.notifications + (data.pendingRequests || 0) }));
        }
      });
      
      // Listen for message read
      socketService.onMessageRead(() => {
        fetchUnreadCounts(); // Refresh counts
      });
    }

    return () => {
      // Cleanup socket listeners
      if (socketService.socket) {
        socketService.removeAllListeners();
      }
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isAuthenticated, user]);



  const handleLogout = async () => {
    await authLogout();
    setShowProfileDropdown(false);
  };

  // Reset notification count when visiting notifications page
  const handleNotificationClick = () => {
    setUnreadNotifications(0);
  };

  // Don't reset count on click - let Chat component handle it
  const handleChatClick = () => {
    // Count will be updated by Chat component
  };

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left Side - Logo/Brand */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2 group">
              <div className="w-8 h-8 bg-gradient-to-r from-[#3E5F44] to-[#5E936C] rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                <Sparkles className="text-white" size={20} />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-[#3E5F44] to-[#5E936C] bg-clip-text text-transparent">
                LikeMinds AI
              </span>
            </Link>
          </div>

          {/* Center - Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <Link 
              to="/" 
              className="text-gray-700 hover:text-[#5E936C] font-medium transition-colors duration-200"
            >
              Home
            </Link>
            <Link 
              to="/about" 
              className="text-gray-700 hover:text-[#5E936C] font-medium transition-colors duration-200"
            >
              About
            </Link>
            <Link 
              to="/features" 
              className="text-gray-700 hover:text-[#5E936C] font-medium transition-colors duration-200"
            >
              Features
            </Link>
            <Link 
              to="/faq" 
              className="text-gray-700 hover:text-[#5E936C] font-medium transition-colors duration-200"
            >
              FAQ
            </Link>
          </div>

          {/* Right Side - Auth/User Actions */}
          <div className="flex items-center space-x-4">
            {!isAuthenticated() ? (
              /* Guest User - Before Login */
              <>
                <Link 
                  to="/login" 
                  className="text-gray-700 hover:text-[#5E936C] font-medium transition-colors duration-200"
                >
                  Login
                </Link>
                <Link 
                  to="/signup" 
                  className="bg-gradient-to-r from-[#3E5F44] to-[#5E936C] hover:from-[#3E5F44] hover:to-[#93DA97] text-white px-6 py-2 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg"
                >
                  Sign Up
                </Link>
              </>
            ) : (
              /* Authenticated User - After Login */
              <>
                <Link 
                  to="/dashboard" 
                  className="text-gray-700 hover:text-[#5E936C] font-medium transition-colors duration-200"
                >
                  Dashboard
                </Link>
                
                {/* Chat with message count badge */}
                <Link 
                  to="/chat" 
                  onClick={handleChatClick}
                  className="text-gray-700 hover:text-[#5E936C] transition-colors duration-200"
                >
                  <ChatIcon count={unreadMessages} size={24} />
                </Link>

                {/* Notifications with count badge */}
                <Link 
                  to="/notifications" 
                  onClick={handleNotificationClick}
                  className="text-gray-700 hover:text-[#5E936C] transition-colors duration-200"
                >
                  <NotificationIcon count={unreadNotifications} size={24} />
                </Link>

                {/* Profile Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                    className="flex items-center space-x-2 text-gray-700 hover:text-[#5E936C] transition-colors duration-200"
                  >
                    <div className="w-8 h-8 bg-gradient-to-r from-[#3E5F44] to-[#5E936C] rounded-full flex items-center justify-center text-white font-semibold">
                      {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <ChevronDown size={16} className={`transform transition-transform duration-200 ${showProfileDropdown ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Dropdown Menu */}
                  {showProfileDropdown && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                      <Link
                        to="/edit-profile"
                        onClick={() => setShowProfileDropdown(false)}
                        className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-[#E8FFD7] hover:text-[#3E5F44] transition-colors duration-200"
                      >
                        <User size={16} />
                        <span>Edit Profile</span>
                      </Link>
                      <hr className="my-2 border-gray-200" />
                      <button
                        onClick={handleLogout}
                        className="flex items-center space-x-2 px-4 py-2 text-red-600 hover:bg-red-50 transition-colors duration-200 w-full text-left"
                      >
                        <LogOut size={16} />
                        <span>Logout</span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu - Optional for responsive design */}
      <div className="md:hidden border-t border-gray-200">
        <div className="px-4 py-2 space-y-1">
          <Link to="/" className="block px-3 py-2 text-gray-700 hover:text-[#5E936C]">
            Home
          </Link>
          <Link to="/about" className="block px-3 py-2 text-gray-700 hover:text-[#5E936C]">
            About
          </Link>
          <Link to="/features" className="block px-3 py-2 text-gray-700 hover:text-[#5E936C]">
            Features
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;