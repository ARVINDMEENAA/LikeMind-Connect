import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import LoginOverlay from './LoginOverlay';
import SignupOverlay from './SignupOverlay';

const Home = () => {
  const [showOverlay, setShowOverlay] = useState(null);
  const { login, signup } = useAuth();
  
  const handleAuth = async (formData, type) => {
    if (!formData || typeof formData !== 'object') {
      throw new Error('Invalid form data');
    }
    
    if (type === 'login' && (!formData.email || !formData.password)) {
      throw new Error('Email and password are required');
    }
    
    if (type === 'signup' && (!formData.name || !formData.email || !formData.password)) {
      throw new Error('Name, email and password are required');
    }
    
    try {
      if (type === 'login') {
        await login(formData);
      } else {
        await signup(formData);
      }
      setShowOverlay(null);
    } catch (error) {
      throw error;
    }
  };

  return (
    <div className="relative min-h-screen">
      {/* Main Home Content */}
      <div className={`min-h-screen bg-gradient-to-br from-green-400 via-blue-400 to-teal-500 flex items-center justify-center transition-all duration-300 ${showOverlay ? 'blur-sm' : ''}`}>
        <div className="text-center px-6 max-w-2xl">
          <h1 className="text-6xl font-bold text-white mb-6 drop-shadow-lg">
            <span className="bg-gradient-to-r from-yellow-300 to-pink-300 bg-clip-text text-transparent">
              LikeMind Connect
            </span>
          </h1>
          <p className="text-xl text-white/90 mb-8 drop-shadow-md">
            Find your perfect hobby match and connect with like-minded people
          </p>
          <div className="space-y-4">
            <button 
              onClick={() => setShowOverlay('login')}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-4 px-10 rounded-full transition duration-300 transform hover:scale-105 shadow-lg"
            >
              Get Started
            </button>
          </div>
        </div>
      </div>
      
      {/* Overlays */}
      {showOverlay === 'login' && (
        <LoginOverlay 
          onClose={() => setShowOverlay(null)}
          onSwitchToSignup={() => setShowOverlay('signup')}
          onAuth={handleAuth}
        />
      )}
      {showOverlay === 'signup' && (
        <SignupOverlay 
          onClose={() => setShowOverlay(null)}
          onSwitchToLogin={() => setShowOverlay('login')}
          onAuth={handleAuth}
        />
      )}
    </div>
  );
};

export default Home;