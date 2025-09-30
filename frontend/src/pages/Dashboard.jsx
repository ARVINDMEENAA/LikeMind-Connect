import { useAuth } from '../hooks/useAuth';
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import socketService from '../utils/socket';
import WelcomeModal from '../components/WelcomeModal';

const Dashboard = () => {
  const { user, logout, isFirstLogin, setIsFirstLogin } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    pendingRequests: 0,
    notifications: 0,
    connections: {
      count: 0,
      list: []
    }
  });
  const [navbarNotificationCount, setNavbarNotificationCount] = useState(0);

  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const [showBlockedUsers, setShowBlockedUsers] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  // Show welcome modal for first-time users
  useEffect(() => {
    if (isFirstLogin) {
      setShowWelcomeModal(true);
    }
  }, [isFirstLogin]);

  useEffect(() => {
    fetchDashboardStats();
    
    // Listen for navbar notification count updates
    const handleNavbarNotificationUpdate = (event) => {
      setNavbarNotificationCount(event.detail);
    };
    
    window.addEventListener('updateDashboardNotificationCount', handleNavbarNotificationUpdate);
    
    // Listen for dashboard stats refresh
    const handleDashboardStatsRefresh = () => {
      fetchDashboardStats();
    };
    
    window.addEventListener('refreshDashboardStats', handleDashboardStatsRefresh);
    
    // Setup socket connection for real-time updates
    if (user?._id) {
      socketService.connect(user._id);
      
      // Listen for dashboard updates
      const handleDashboardUpdate = (data) => {
        console.log('Dashboard update received:', data);
        setStats(prevStats => ({
          ...prevStats,
          ...data
        }));
        
        // Auto-refresh data if needed
        if (data.refreshNeeded) {
          fetchDashboardStats();
        }
      };
      
      socketService.onDashboardUpdate(handleDashboardUpdate);
      
      // Listen for new notifications
      socketService.socket?.on('new_notification', () => {
        fetchDashboardStats();
      });
    }
    
    return () => {
      if (socketService.socket) {
        socketService.socket.off('dashboard_update');
        socketService.socket.off('new_notification');
      }
      window.removeEventListener('updateDashboardNotificationCount', handleNavbarNotificationUpdate);
      window.removeEventListener('refreshDashboardStats', handleDashboardStatsRefresh);
    };
  }, [user]);

  const fetchDashboardStats = async () => {
    try {
      const response = await api.get('/dashboard-stats');
      setStats(response.data);
      console.log('Dashboard stats updated:', response.data);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    }
  };

  const fetchFollowers = async () => {
    try {
      const response = await api.get('/followers');
      setFollowers(response.data || []);
      setShowFollowers(true);
    } catch (error) {
      console.error('Error fetching followers:', error);
    }
  };

  const fetchFollowing = async () => {
    try {
      const response = await api.get('/following');
      setFollowing(response.data || []);
      setShowFollowing(true);
    } catch (error) {
      console.error('Error fetching following:', error);
    }
  };

  const fetchBlockedUsers = async () => {
    try {
      const response = await api.get('/blocked-users');
      setBlockedUsers(response.data?.list || []);
      setShowBlockedUsers(true);
    } catch (error) {
      console.error('Error fetching blocked users:', error);
    }
  };

  const handleUnblockUser = async (userId) => {
    try {
      await api.post('/unblock', { userId });
      setBlockedUsers(prev => prev.filter(user => user._id !== userId));
      // Update stats immediately
      setStats(prev => ({
        ...prev,
        blockedUsers: prev.blockedUsers - 1
      }));
    } catch (error) {
      console.error('Error unblocking user:', error);
    }
  };

  const handleBlockUser = async (userId) => {
    try {
      await api.post('/block', { userId });
      // Remove from connections and update stats
      setStats(prev => ({
        ...prev,
        connections: {
          ...prev.connections,
          count: prev.connections.count - 1,
          list: prev.connections.list.filter(conn => conn._id !== userId)
        },
        blockedUsers: prev.blockedUsers + 1
      }));
      setShowFollowers(false);
    } catch (error) {
      console.error('Error blocking user:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E8FFD7] via-[#93DA97] to-[#5E936C] p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-r from-[#3E5F44] to-[#5E936C] rounded-full flex items-center justify-center text-white font-bold text-xl overflow-hidden">
              {user?.profile_picture ? (
                <img 
                  src={user.profile_picture} 
                  alt={user.name}
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                user?.name?.charAt(0)?.toUpperCase() || 'U'
              )}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-green-800">{user?.name}</h1>
              <p className="text-green-600">Welcome back!</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Logout
          </button>
        </div>

        {/* Stats Cards - Repositioned */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-[#E8FFD7]/90 backdrop-blur-sm rounded-lg shadow-lg p-6 cursor-pointer hover:shadow-xl transition-shadow border-l-4 border-green-500" onClick={fetchFollowers}>
            <h3 className="text-lg font-semibold text-green-800">Connections</h3>
            <p className="text-3xl font-bold text-green-700">{stats.connections?.count || 0}</p>
            <p className="text-sm text-green-600 mt-1">Click to view</p>
          </div>
          <div className="bg-[#E8FFD7]/90 backdrop-blur-sm rounded-lg shadow-lg p-6 border-l-4 border-orange-500">
            <h3 className="text-lg font-semibold text-green-800">Pending Requests</h3>
            <p className="text-3xl font-bold text-orange-600">{stats.pendingRequests || 0}</p>
            <p className="text-sm text-green-600 mt-1">
              {stats.pendingRequests > 0 && (
                <Link to="/notifications" className="text-orange-600 hover:underline">
                  View requests
                </Link>
              )}
            </p>
          </div>
          <div className="bg-[#E8FFD7]/90 backdrop-blur-sm rounded-lg shadow-lg p-6 border-l-4 border-green-500">
            <h3 className="text-lg font-semibold text-green-800">Notifications</h3>
            <p className="text-3xl font-bold text-green-700">{navbarNotificationCount || stats.notifications || 0}</p>
            <p className="text-sm text-green-600 mt-1">
              {stats.notifications > 0 && (
                <Link to="/notifications" className="text-green-600 hover:underline">
                  View notifications
                </Link>
              )}
            </p>
          </div>
        </div>

        {/* Quick Actions - Full Width */}
        <div className="mb-8">
          <div className="bg-[#E8FFD7]/90 backdrop-blur-sm rounded-lg shadow-lg p-6 border-l-4 border-green-500">
            <h2 className="text-xl font-semibold text-green-800 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Link to="/chat" className="bg-green-500 hover:bg-green-600 text-white py-3 px-4 rounded-lg text-center transition-colors font-medium">
                Messages
              </Link>
              <Link to="/notifications" className="bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg text-center transition-colors font-medium">
                Notifications
              </Link>
              <Link to="/find-connections" className="bg-green-700 hover:bg-green-800 text-white py-3 px-4 rounded-lg text-center transition-colors font-medium">
                Find Connections
              </Link>
              <button onClick={fetchBlockedUsers} className="bg-red-500 hover:bg-red-600 text-white py-3 px-4 rounded-lg text-center transition-colors font-medium">
                Blocked Users
              </button>
            </div>
          </div>
        </div>

        {/* Blocked Users Stats - Separate Card */}
        <div className="mb-8">
          <div className="bg-[#E8FFD7]/90 backdrop-blur-sm rounded-lg shadow-lg p-6 cursor-pointer hover:shadow-xl transition-shadow border-l-4 border-red-500" onClick={fetchBlockedUsers}>
            <h3 className="text-lg font-semibold text-green-800">Blocked Users Management</h3>
            <p className="text-3xl font-bold text-red-600">{stats.blockedUsers || 0}</p>
            <p className="text-sm text-green-600 mt-1">Click to manage blocked users</p>
          </div>
        </div>

        {/* Followers Modal */}
        {showFollowers && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-[#E8FFD7]/95 backdrop-blur-sm rounded-lg p-6 max-w-2xl w-full mx-4 max-h-96 overflow-y-auto border border-green-200">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Connections ({stats.connections?.count || 0})</h3>
                <button onClick={() => setShowFollowers(false)} className="text-gray-500 hover:text-gray-700">
                  ✕
                </button>
              </div>
              {stats.connections?.list?.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No connections yet</p>
              ) : (
                <div className="space-y-3">
                  {stats.connections?.list?.map(connection => (
                    <div key={connection._id} className="flex items-center p-3 bg-gray-50 rounded-lg">
                      <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold mr-3 flex-shrink-0">
                        {connection.avatar || connection.profile_picture ? (
                          <img 
                            src={connection.avatar || connection.profile_picture} 
                            alt={connection.name} 
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          connection.name?.charAt(0) || 'U'
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900">
                          {connection.fullName || connection.name || 'Unknown User'}
                        </div>
                        {connection.bio && (
                          <p className="text-sm text-gray-600 truncate">{connection.bio}</p>
                        )}
                        <div className="flex flex-wrap gap-2 mt-1">
                          {connection.location && (
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              📍 {connection.location}
                            </span>
                          )}
                          {connection.occupation && (
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                              💼 {connection.occupation}
                            </span>
                          )}
                          {connection.age && (
                            <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                              {connection.age} years
                            </span>
                          )}
                        </div>
                        {connection.hobbies && connection.hobbies.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {connection.hobbies.slice(0, 3).map((hobby, index) => (
                              <span key={index} className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">
                                {hobby}
                              </span>
                            ))}
                            {connection.hobbies.length > 3 && (
                              <span className="text-xs text-gray-500">+{connection.hobbies.length - 3} more</span>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <button
                          onClick={() => navigate(`/chat?userId=${connection._id}`)}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm transition-colors"
                        >
                          Message
                        </button>
                        <button
                          onClick={() => handleBlockUser(connection._id)}
                          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm transition-colors"
                        >
                          Block
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Following Modal */}
        {showFollowing && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-[#E8FFD7]/95 backdrop-blur-sm rounded-lg p-6 max-w-md w-full mx-4 max-h-96 overflow-y-auto border border-green-200">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Following ({following.length})</h3>
                <button onClick={() => setShowFollowing(false)} className="text-gray-500 hover:text-gray-700">
                  ✕
                </button>
              </div>
              {following.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Not following anyone yet</p>
              ) : (
                <div className="space-y-3">
                  {following.map(user => (
                    <div key={user._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center text-white font-semibold mr-3">
                          {user.name?.charAt(0) || 'U'}
                        </div>
                        <span className="font-medium">{user.name || 'Unknown User'}</span>
                      </div>
                      <button
                        onClick={() => handleBlockUser(user._id)}
                        className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs transition-colors"
                      >
                        Block
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Blocked Users Modal */}
        {showBlockedUsers && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-[#E8FFD7]/95 backdrop-blur-sm rounded-lg p-6 max-w-2xl w-full mx-4 max-h-96 overflow-y-auto border border-green-200">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Blocked Users ({blockedUsers.length})</h3>
                <button onClick={() => setShowBlockedUsers(false)} className="text-gray-500 hover:text-gray-700">
                  ✕
                </button>
              </div>
              {blockedUsers.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No blocked users</p>
              ) : (
                <div className="space-y-3">
                  {blockedUsers.map(user => (
                    <div key={user._id} className="flex items-center p-3 bg-gray-50 rounded-lg">
                      <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center text-white font-semibold mr-3 flex-shrink-0">
                        {user.avatar || user.profile_picture ? (
                          <img 
                            src={user.avatar || user.profile_picture} 
                            alt={user.name} 
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          user.name?.charAt(0) || 'U'
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900">
                          {user.fullName || user.name || 'Unknown User'}
                        </div>
                        {user.bio && (
                          <p className="text-sm text-gray-600 truncate">{user.bio}</p>
                        )}
                        <div className="flex flex-wrap gap-2 mt-1">
                          {user.location && (
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              📍 {user.location}
                            </span>
                          )}
                          {user.occupation && (
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                              💼 {user.occupation}
                            </span>
                          )}
                          {user.age && (
                            <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                              {user.age} years
                            </span>
                          )}
                        </div>
                        {user.hobbies && user.hobbies.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {user.hobbies.slice(0, 3).map((hobby, index) => (
                              <span key={index} className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">
                                {hobby}
                              </span>
                            ))}
                            {user.hobbies.length > 3 && (
                              <span className="text-xs text-gray-500">+{user.hobbies.length - 3} more</span>
                            )}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => handleUnblockUser(user._id)}
                        className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm transition-colors flex-shrink-0"
                      >
                        Unblock
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Welcome Modal for First-Time Users */}
        <WelcomeModal 
          isFirstLogin={showWelcomeModal}
          userName={user?.name}
          onClose={() => {
            setShowWelcomeModal(false);
            setIsFirstLogin(false);
            navigate('/chat');
          }}
        />
      </div>
    </div>
  );
};

export default Dashboard;