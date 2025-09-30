import { useState, useEffect } from 'react';

const WelcomeModal = ({ isFirstLogin, userName, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isFirstLogin) {
      setIsVisible(true);
    }
  }, [isFirstLogin]);

  const handleClose = () => {
    setIsVisible(false);
    onClose();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 animate-pulse">
        <div className="text-center">
          <div className="text-4xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Welcome to LikeMind Connect!
          </h2>
          <p className="text-gray-600 mb-6">
            Hi {userName}! You have a special welcome message from our AI assistant. 
            Check your chat to get started!
          </p>
          <button
            onClick={handleClose}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 py-2 rounded-md transition duration-300"
          >
            Check Messages
          </button>
        </div>
      </div>
    </div>
  );
};

export default WelcomeModal;