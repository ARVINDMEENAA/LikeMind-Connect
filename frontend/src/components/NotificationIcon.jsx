import React from 'react';
import { Bell } from 'lucide-react';

const NotificationIcon = ({ count = 0, size = 24, className = "" }) => {
  return (
    <div className={`relative inline-block ${className}`}>
      <Bell size={size} />
      {count > 0 && (
        <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center font-semibold animate-pulse">
          {count > 99 ? '99+' : count}
        </div>
      )}
    </div>
  );
};

export default NotificationIcon;