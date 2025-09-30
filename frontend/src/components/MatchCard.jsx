import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, MessageCircle } from 'lucide-react';
import FollowButton from './FollowButton';

const MatchCard = ({ match }) => {
  const navigate = useNavigate();
  const [showTooltip, setShowTooltip] = useState(false);

  const handleViewDetails = () => {
    navigate(`/match/${match._id || match.id}`);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 transform hover:scale-105">
      {/* Profile Photo */}
      <div className="flex justify-center mb-4">
        <img
          src={match.profile_picture || match.avatar || 'https://via.placeholder.com/100x100?text=User'}
          alt={match.name}
          className="w-20 h-20 rounded-full object-cover border-4 border-purple-200"
        />
      </div>
      
      <div className="text-center mb-4">
        <div className="flex items-center justify-center gap-2 mb-2">
          <h3 className="text-xl font-bold text-gray-900">
            {match.name || 'Unknown'}
          </h3>
          <div 
            className="relative flex items-center bg-gradient-to-r from-red-500 to-pink-500 text-white px-3 py-1 rounded-full shadow-md cursor-pointer hover:shadow-lg transition-all duration-200"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
          >
            <Heart size={16} className="mr-1 fill-current" />
            <span className="text-sm font-bold">{Math.round(match.matchPercentage || match.matchScore || 0)}%</span>
            
            {showTooltip && match.sharedHobbies && match.sharedHobbies.length > 0 && (
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-gray-800 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap z-10 shadow-lg">
                <div className="font-semibold mb-1">Shared Hobbies:</div>
                <div>{match.sharedHobbies.slice(0, 3).join(', ')}</div>
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
              </div>
            )}
          </div>
        </div>
        {match.age && (
          <p className="text-gray-600">{match.age} years old</p>
        )}
        {match.location && (
          <p className="text-sm text-gray-500">{match.location}</p>
        )}
      </div>

      <div className="mb-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-2">Hobbies:</h4>
        <div className="flex flex-wrap gap-2">
          {(match.hobbies || []).slice(0, 3).map((hobby, index) => (
            <span
              key={index}
              className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-medium"
            >
              {hobby}
            </span>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <FollowButton 
          userId={match._id || match.id} 
          followStatus={match.followStatus}
          onStatusChange={(newStatus) => {
            console.log('Follow status changed:', newStatus);
          }}
        />
        <button
          onClick={handleViewDetails}
          className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg transition-all duration-200"
        >
          View Profile
        </button>
      </div>
    </div>
  );
};

export default MatchCard;