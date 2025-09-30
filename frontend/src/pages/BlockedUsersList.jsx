import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import api from '../utils/api';

const BlockedUsersList = () => {
  const navigate = useNavigate();
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBlockedUsers();
  }, []);

  const fetchBlockedUsers = async () => {
    try {
      const response = await api.get('/blocked-users');
      setBlockedUsers(response.data?.list || []);
    } catch (error) {
      console.error('Error fetching blocked users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnblockUser = async (userId) => {
    try {
      await api.post('/unblock', { userId });
      setBlockedUsers(prev => prev.filter(user => user._id !== userId));
    } catch (error) {
      console.error('Error unblocking user:', error);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-[#E8FFD7] via-[#93DA97] to-[#5E936C] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-800 mx-auto mb-4"></div>
          <p className="text-green-800 font-medium">Loading blocked users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="blocked-users-list fixed inset-0 bg-gradient-to-br from-[#E8FFD7] via-[#93DA97] to-[#5E936C] overflow-auto">
      <div className="min-h-full">
        <div className="w-full h-full">
          <div className="flex items-center mb-6 p-6 pb-0">
            <button
              onClick={() => navigate('/dashboard')}
              className="bg-[#E8FFD7]/90 backdrop-blur-sm hover:bg-[#E8FFD7] p-2 rounded-lg mr-4 transition-colors"
            >
              <ArrowLeft className="text-green-800" size={24} />
            </button>
            <h1 className="text-3xl font-bold text-green-800">Blocked Users ({blockedUsers.length})</h1>
          </div>

          {blockedUsers.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🚫</div>
              <h3 className="text-2xl font-semibold text-green-800 mb-2">No blocked users</h3>
              <p className="text-green-600">Users you block will appear here</p>
            </div>
          ) : (
            <div className="w-full h-full bg-[#E8FFD7]/90 backdrop-blur-sm overflow-hidden">
              <div className="w-full h-full overflow-auto">
                <table className="w-full min-w-full">
                  <thead className="bg-red-600 text-white">
                    <tr>
                      <th className="px-6 py-4 text-left font-semibold">Profile</th>
                      <th className="px-6 py-4 text-left font-semibold">Name</th>
                      <th className="px-6 py-4 text-left font-semibold">Age & Location</th>
                      <th className="px-6 py-4 text-left font-semibold">Occupation</th>
                      <th className="px-6 py-4 text-left font-semibold">Bio</th>
                      <th className="px-6 py-4 text-left font-semibold">Hobbies</th>
                      <th className="px-6 py-4 text-center font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {blockedUsers.map((user, index) => (
                      <tr key={user._id} className={`border-b border-red-200 hover:bg-red-50 ${index % 2 === 0 ? 'bg-white/50' : 'bg-red-50/30'}`}>
                        <td className="px-6 py-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-gray-500 to-gray-700 rounded-full flex items-center justify-center text-white font-bold relative">
                            {user.profile_picture ? (
                              <img 
                                src={user.profile_picture} 
                                alt={user.name}
                                className="w-12 h-12 rounded-full object-cover grayscale"
                              />
                            ) : (
                              user.name?.charAt(0)?.toUpperCase() || 'U'
                            )}
                            <div className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                              🚫
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-semibold text-green-800">
                          {user.name || 'Unknown User'}
                        </td>
                        <td className="px-6 py-4 text-green-700">
                          {user.age && user.location ? `${user.age} • ${user.location}` : '-'}
                        </td>
                        <td className="px-6 py-4 text-green-700">
                          {user.occupation || '-'}
                        </td>
                        <td className="px-6 py-4 text-green-700 max-w-xs">
                          {user.bio ? (
                            <span className="italic text-sm">"{user.bio.length > 50 ? user.bio.substring(0, 50) + '...' : user.bio}"</span>
                          ) : '-'}
                        </td>
                        <td className="px-6 py-4">
                          {user.hobbies && user.hobbies.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {user.hobbies.slice(0, 2).map((hobby, idx) => (
                                <span key={idx} className="bg-gray-200 text-gray-800 px-2 py-1 rounded-full text-xs">
                                  {hobby}
                                </span>
                              ))}
                              {user.hobbies.length > 2 && (
                                <span className="text-green-600 text-xs">+{user.hobbies.length - 2}</span>
                              )}
                            </div>
                          ) : '-'}
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleUnblockUser(user._id)}
                            className="bg-green-600 hover:bg-green-700 text-white py-1 px-3 rounded text-sm transition-colors"
                          >
                            Unblock
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BlockedUsersList;