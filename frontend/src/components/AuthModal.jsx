import React, { useState } from 'react';
import LoginForm from './LoginForm';
import SignupForm from './SignupForm';

const AuthModal = ({ isOpen, onClose, onAuth }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleAuth = async (formData) => {
    setLoading(true);
    try {
      await onAuth(formData, isLogin ? 'login' : 'signup');
      onClose();
    } catch (error) {
      console.error('Auth error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="relative">
        <button
          onClick={onClose}
          className="absolute -top-2 -right-2 bg-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg hover:bg-gray-100"
        >
          ×
        </button>
        {isLogin ? (
          <LoginForm
            onLogin={handleAuth}
            onSwitchToSignup={() => setIsLogin(false)}
            loading={loading}
          />
        ) : (
          <SignupForm
            onSignup={handleAuth}
            onSwitchToLogin={() => setIsLogin(true)}
            loading={loading}
          />
        )}
      </div>
    </div>
  );
};

export default AuthModal;