import React, { useState, useEffect } from 'react';
import { UserPlus, Clock, Check } from 'lucide-react';
import api from '../utils/api';

const FollowButton = ({ userId, followStatus = 'none', onStatusChange }) => {
  const [status, setStatus] = useState(followStatus); // 'none', 'pending', 'accepted', 'received'
  const [loading, setLoading] = useState(false);
  
  // Sync status with prop changes
  useEffect(() => {
    setStatus(followStatus);
  }, [followStatus]);

  const handleFollow = async () => {
    if (loading) return;
    
    // Don't allow action if already connected or pending
    if (status === 'accepted' || status === 'pending') return;
    
    setLoading(true);
    try {
      if (status === 'none') {
        await api.post('/follow', { userId });
        setStatus('pending');
        onStatusChange?.('pending');
      }
    } catch (error) {
      console.error('Error sending follow request:', error);
      if (!error.response?.data?.message?.includes('already')) {
        alert(error.response?.data?.message || 'Failed to send follow request');
      }
    } finally {
      setLoading(false);
    }
  };

  const getButtonContent = () => {
    switch (status) {
      case 'pending':
        return {
          icon: <Clock size={16} />,
          text: 'Requested',
          className: 'bg-yellow-500 hover:bg-yellow-600 cursor-not-allowed',
          disabled: true
        };
      case 'accepted':
        return {
          icon: <Check size={16} />,
          text: 'Connected',
          className: 'bg-green-500 hover:bg-green-600 cursor-not-allowed',
          disabled: true
        };
      case 'received':
        return {
          icon: <Clock size={16} />,
          text: 'Respond',
          className: 'bg-purple-500 hover:bg-purple-600',
          disabled: false
        };
      default:
        return {
          icon: <UserPlus size={16} />,
          text: 'Follow',
          className: 'bg-blue-500 hover:bg-blue-600',
          disabled: false
        };
    }
  };

  const buttonContent = getButtonContent();

  return (
    <button
      onClick={handleFollow}
      disabled={loading || buttonContent.disabled}
      className={`flex items-center space-x-2 text-white px-4 py-2 rounded-lg transition-all duration-200 ${buttonContent.className} ${
        loading ? 'opacity-50 cursor-not-allowed' : ''
      }`}
    >
      {loading ? (
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
      ) : (
        buttonContent.icon
      )}
      <span>{loading ? 'Sending...' : buttonContent.text}</span>
    </button>
  );
};

export default FollowButton;