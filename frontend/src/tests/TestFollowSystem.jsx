import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import FollowButton from '../components/FollowButton';
import api from '../utils/api';
import socketService from '../utils/socket';

const TestFollowSystem = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [dashboardStats, setDashboardStats] = useState({
    pendingRequests: 0,
    notifications: 0,
    connections: { count: 0, list: [] }
  });

  useEffect(() => {
    fetchUsers();
    fetchDashboardStats();
    
    // Setup socket for real-time updates
    if (user?._id) {
      socketService.connect(user._id);
      
      socketService.onDashboardUpdate((data) => {
        setDashboardStats(prevStats => ({
          ...prevStats,
          ...data
        }));
      });
    }

    return () => {
      if (socketService.socket) {
        socketService.socket.off('dashboard_update');
      }
    };
  }, [user]);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/profile/all-users');
      setUsers(response.data.filter(u => u._id !== user?._id));
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchDashboardStats = async () => {
    try {
      const response = await api.get('/follow/dashboard-stats');
      setDashboardStats(response.data);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Follow System Test</h1>
        
        {/* Dashboard Stats */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Your Stats (Real-time)</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{dashboardStats.connections?.count || 0}</p>
              <p className="text-sm text-gray-600">Connections</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">{dashboardStats.pendingRequests || 0}</p>
              <p className="text-sm text-gray-600">Pending Requests</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{dashboardStats.notifications || 0}</p>
              <p className="text-sm text-gray-600">Notifications</p>
            </div>
          </div>
        </div>

        {/* Users List */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Other Users</h2>
          <div className="space-y-4">
            {users.map(otherUser => (
              <div key={otherUser._id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                    {otherUser.name?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <p className="font-medium">{otherUser.name || 'Unknown User'}</p>
                    <p className="text-sm text-gray-500">{otherUser.email}</p>
                  </div>
                </div>
                <FollowButton 
                  userId={otherUser._id}
                  onStatusChange={(status) => {
                    console.log(`Follow status changed to: ${status}`);
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Connections List */}
        {dashboardStats.connections?.list?.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mt-6">
            <h2 className="text-xl font-semibold mb-4">Your Connections</h2>
            <div className="space-y-3">
              {dashboardStats.connections.list.map(connection => (
                <div key={connection._id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-semibold">
                    {connection.name?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <p className="font-medium">{connection.name || 'Unknown User'}</p>
                    {connection.bio && <p className="text-sm text-gray-500">{connection.bio}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TestFollowSystem;