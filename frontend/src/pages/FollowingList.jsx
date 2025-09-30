import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import api from '../utils/api';

const FollowingList = () => {
  const navigate = useNavigate();
  const [following, setFollowing] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFollowing();
  }, []);

  const fetchFollowing = async () => {
    try {
      const response = await api.get('/following');
      setFollowing(response.data || []);
    } catch (error) {
      console.error('Error fetching following:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnfollow = async (userId) => {
    try {
      await api.post('/unfollow', { userId });
      setFollowing(prev => prev.filter(user => user._id !== userId));
    } catch (error) {
      console.error('Error unfollowing user:', error);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-[#E8FFD7] via-[#93DA97] to-[#5E936C] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-800 mx-auto mb-4"></div>
          <p className="text-green-800 font-medium">Loading following...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="following-list fixed inset-0 bg-gradient-to-br from-[#E8FFD7] via-[#93DA97] to-[#5E936C] overflow-auto">
      <div className="min-h-full">
        <div className="w-full h-full">
          <div className="flex items-center mb-6 p-6 pb-0">
            <button
              onClick={() => navigate('/dashboard')}
              className="bg-[#E8FFD7]/90 backdrop-blur-sm hover:bg-[#E8FFD7] p-2 rounded-lg mr-4 transition-colors"
            >
              <ArrowLeft className="text-green-800" size={24} />
            </button>
            <h1 className="text-3xl font-bold text-green-800">Following ({following.length})</h1>
          </div>

          {following.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">👥</div>
              <h3 className="text-2xl font-semibold text-green-800 mb-2">Not following anyone yet</h3>
              <p className="text-green-600">Start following people to see them here</p>
            </div>
          ) : (
            <div className="w-full h-full bg-[#E8FFD7]/90 backdrop-blur-sm overflow-hidden">
              <div className="w-full h-full overflow-auto">
                <table className="w-full min-w-full">
                  <thead className="bg-green-600 text-white">
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
                    {following.map((user, index) => (
                      <tr key={user._id} className={`border-b border-green-200 hover:bg-green-50 ${index % 2 === 0 ? 'bg-white/50' : 'bg-green-50/30'}`}>
                        <td className="px-6 py-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-700 rounded-full flex items-center justify-center text-white font-bold">
                            {user.profile_picture ? (
                              <img 
                                src={user.profile_picture} 
                                alt={user.name}
                                className="w-12 h-12 rounded-full object-cover"
                              />
                            ) : (
                              user.name?.charAt(0)?.toUpperCase() || 'U'
                            )}
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
                                <span key={idx} className="bg-green-200 text-green-800 px-2 py-1 rounded-full text-xs">
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
                          <div className="flex gap-2 justify-center">
                            <button
                              onClick={() => navigate(`/chat?userId=${user._id}`)}
                              className="bg-green-600 hover:bg-green-700 text-white py-1 px-3 rounded text-sm transition-colors"
                            >
                              Message
                            </button>
                            <button
                              onClick={() => handleUnfollow(user._id)}
                              className="bg-orange-500 hover:bg-orange-600 text-white py-1 px-3 rounded text-sm transition-colors"
                            >
                              Unfollow
                            </button>
                          </div>
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

export default FollowingList;