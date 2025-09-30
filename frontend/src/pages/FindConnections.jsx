import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import MatchCard from '../components/MatchCard';

const FindConnections = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        console.log('Fetching recommendations...');
        const response = await api.get(`/recommendations?t=${Date.now()}`);
        console.log('Recommendations response:', response.data);
        setRecommendations(response.data.recommendations || []);
      } catch (error) {
        console.error('Error fetching recommendations:', error);
        // Always set empty array on error
        setRecommendations([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [user, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Finding connections...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Find Connections</h1>
          <p className="text-gray-600">People who share your interests</p>
        </div>


        
        {recommendations.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🌟</div>
            <h3 className="text-2xl font-semibold text-gray-700 mb-2">No matches found right now!</h3>
            <p className="text-gray-500 mb-4">Don't worry, new people join every day.</p>
            <p className="text-gray-500">Check back later to discover amazing connections! 🚀</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recommendations.map((user) => (
              <MatchCard key={user._id || user.id} match={user} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FindConnections;