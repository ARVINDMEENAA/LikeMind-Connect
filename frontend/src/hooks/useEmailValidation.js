import { useState, useEffect } from 'react';
import { validateEmail } from '../utils/emailValidator';

export const useEmailValidation = (email, debounceMs = 300) => {
  const [validation, setValidation] = useState({ 
    isValid: true, 
    message: '', 
    isChecking: false 
  });

  useEffect(() => {
    if (!email) {
      setValidation({ isValid: true, message: '', isChecking: false });
      return;
    }

    setValidation(prev => ({ ...prev, isChecking: true }));

    const timer = setTimeout(() => {
      const result = validateEmail(email);
      setValidation({ 
        ...result, 
        isChecking: false 
      });
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [email, debounceMs]);

  return validation;
};