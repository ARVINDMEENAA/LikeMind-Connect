import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Heart, MessageCircle, Mail, Phone } from 'lucide-react';
import api from '../utils/api';
import FollowButton from '../components/FollowButton';

const MatchDetails = () => {
  const { id } = useParams();
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chatRequested, setChatRequested] = useState(false);
  const [followStatus, setFollowStatus] = useState('none'); // none, pending, accepted
  const [showMatchTooltip, setShowMatchTooltip] = useState(false);

  useEffect(() => {
    const fetchUserDetails = async () => {
      setLoading(true);
      try {
        const response = await api.get(`/user/${id}`);
        const userData = response.data.user;
        
        // Check follow status
        try {
          const followResponse = await api.get('/follow/status', { params: { userId: id } });
          setFollowStatus(followResponse.data.status || 'none');
        } catch (error) {
          console.log('No follow status found, defaulting to none');
          setFollowStatus('none');
        }
        
        // Get match percentage from Spacy+Pinecone
        let matchPercentage = 75;
        let sharedHobbies = [];
        
        try {
          const matchResponse = await api.get(`/match/percentage/${id}`);
          matchPercentage = matchResponse.data.matchPercentage;
          sharedHobbies = matchResponse.data.sharedHobbies;
        } catch (error) {
          console.log('Match percentage API failed, using default:', error.message);
          matchPercentage = 75;
          sharedHobbies = [];
        }
        
        setMatch({
          id: userData._id,
          name: userData.name || userData.fullName || 'Unknown User',
          age: userData.age,
          photo: userData.profile_picture || userData.avatar || 'https://via.placeholder.com/300x300',
          bio: userData.bio || 'No bio available',
          location: userData.location || 'Location not specified',
          occupation: userData.occupation || 'Occupation not specified',
          gender: userData.gender || 'Not specified',
          hobbies: userData.hobbies || [],
          sharedHobbies: sharedHobbies,
          matchScore: matchPercentage,
          contactInfo: {
            email: userData.email,
            phone: userData.phone
          },
          bothAgreedToShare: false
        });
      } catch (error) {
        console.error('Error fetching user details:', error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchUserDetails();
    }
  }, [id]);

  const handleChatRequest = async () => {
    setLoading(true);
    try {
      console.log('Sending follow request to user ID:', id);
      const response = await api.post('/follow', {
        userId: id
      });
      if (response.status === 200) {
        setChatRequested(true);
      }
    } catch (error) {
      console.error('Follow request failed:', error);
      if (error.response?.data?.message?.includes('already exists')) {
        setFollowStatus('pending');
      } else if (error.response?.data?.message) {
        alert(error.response.data.message);
      }
    }
    setLoading(false);
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading profile...</p>
      </div>
    </div>
  );
  
  if (!match) return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Profile not found</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl p-8">
        {/* Header with Photo and Basic Info */}
        <div className="text-center mb-8">
          <img
            src={match.photo}
            alt={match.name}
            className="w-48 h-48 rounded-full mx-auto mb-6 object-cover shadow-lg"
          />
          <div className="flex items-center justify-center gap-4 mb-4">
            <h1 className="text-4xl font-bold text-gray-900">{match.name}</h1>
            <div 
              className="relative flex items-center bg-gradient-to-r from-red-500 to-pink-500 text-white px-4 py-2 rounded-full cursor-pointer hover:shadow-lg transition-all duration-200"
              onMouseEnter={() => setShowMatchTooltip(true)}
              onMouseLeave={() => setShowMatchTooltip(false)}
            >
              <Heart size={20} className="mr-2" fill="currentColor" />
              <span className="font-bold text-lg">{match.matchScore || 0}%</span>
              
              {showMatchTooltip && match.sharedHobbies && match.sharedHobbies.length > 0 && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 bg-gray-800 text-white text-sm rounded-lg px-4 py-3 whitespace-nowrap z-10 shadow-xl">
                  <div className="font-semibold mb-2">Hobby Match Based On:</div>
                  <div className="text-xs">{match.sharedHobbies.join(', ')}</div>
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                </div>
              )}
            </div>
          </div>
          <div className="text-center text-gray-600 text-lg space-y-1">
            {match.age && <p>{match.age} years old</p>}
            {match.gender && <p>{match.gender}</p>}
            <p>{match.occupation} • {match.location}</p>
          </div>
        </div>

        {/* Bio */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-3">About</h3>
          <p className="text-gray-700 leading-relaxed">{match.bio}</p>
        </div>

        {/* Shared Hobbies */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Shared Hobbies</h3>
          <div className="flex flex-wrap gap-3">
            {match.sharedHobbies.map((hobby, index) => (
              <span
                key={index}
                className="bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 px-4 py-2 rounded-full text-sm font-medium border border-purple-200"
              >
                {hobby}
              </span>
            ))}
          </div>
        </div>

        {/* All Hobbies */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">All Hobbies</h3>
          <div className="flex flex-wrap gap-2">
            {match.hobbies.map((hobby, index) => (
              <span
                key={index}
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  match.sharedHobbies.includes(hobby)
                    ? 'bg-purple-100 text-purple-700 border border-purple-200'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {hobby}
              </span>
            ))}
          </div>
        </div>

        {/* Contact Info - Conditional */}
        {match.bothAgreedToShare && (
          <div className="mb-8 p-6 bg-green-50 rounded-xl border border-green-200">
            <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
              Contact Information
            </h3>
            <div className="space-y-3">
              <div className="flex items-center text-gray-700">
                <Mail size={18} className="mr-3 text-gray-500" />
                <span>{match.contactInfo.email}</span>
              </div>
              <div className="flex items-center text-gray-700">
                <Phone size={18} className="mr-3 text-gray-500" />
                <span>{match.contactInfo.phone}</span>
              </div>
            </div>
          </div>
        )}

        {/* Follow Request Button */}
        <div className="text-center">
          <FollowButton 
            userId={id}
            followStatus={followStatus}
            onStatusChange={(newStatus) => {
              setFollowStatus(newStatus);
              if (newStatus === 'pending') {
                setChatRequested(true);
              }
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default MatchDetails;