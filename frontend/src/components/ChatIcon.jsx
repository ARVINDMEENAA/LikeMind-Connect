import React from 'react';
import { MessageCircle } from 'lucide-react';

const ChatIcon = ({ count = 0, size = 24, className = "" }) => {
  return (
    <div className={`relative inline-block ${className}`}>
      <MessageCircle size={size} />
      {count > 0 && (
        <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center font-semibold animate-bounce">
          {count > 999 ? '999+' : count}
        </div>
      )}
    </div>
  );
};

export default ChatIcon;