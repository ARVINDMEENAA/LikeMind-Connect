import React, { useState, useEffect } from 'react';
import { validateEmail } from '../utils/emailValidator';

const EmailInput = ({ value, onChange, placeholder = "Enter your email" }) => {
  const [validation, setValidation] = useState({ isValid: true, message: '' });
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    if (!value) {
      setValidation({ isValid: true, message: '' });
      return;
    }

    setIsTyping(true);
    const timer = setTimeout(() => {
      const result = validateEmail(value);
      setValidation(result);
      setIsTyping(false);
    }, 300); // Debounce for 300ms

    return () => clearTimeout(timer);
  }, [value]);

  const getInputStyle = () => {
    if (!value) return 'border-gray-300';
    if (isTyping) return 'border-yellow-400';
    return validation.isValid ? 'border-green-500' : 'border-red-500';
  };

  const getIconStyle = () => {
    if (!value || isTyping) return 'text-gray-400';
    return validation.isValid ? 'text-green-500' : 'text-red-500';
  };

  return (
    <div className="relative">
      <input
        type="email"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full px-4 py-2 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${getInputStyle()}`}
      />
      
      {/* Status Icon */}
      <div className={`absolute right-3 top-2.5 ${getIconStyle()}`}>
        {isTyping ? (
          <div className="animate-spin h-5 w-5 border-2 border-yellow-400 border-t-transparent rounded-full"></div>
        ) : value ? (
          validation.isValid ? (
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          )
        ) : null}
      </div>
      
      {/* Error Message */}
      {value && !validation.isValid && !isTyping && (
        <p className="text-red-500 text-sm mt-1">{validation.message}</p>
      )}
    </div>
  );
};

export default EmailInput;