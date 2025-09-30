// Frontend email validation utility
export const validateEmailFormat = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isGmailAddress = (email) => {
  return email.toLowerCase().endsWith('@gmail.com');
};

export const validateGmailFormat = (email) => {
  if (!email) return { valid: false, message: 'Email is required' };
  
  if (!validateEmailFormat(email)) {
    return { valid: false, message: 'Invalid email format' };
  }
  
  if (!isGmailAddress(email)) {
    return { valid: false, message: 'Only Gmail accounts are allowed' };
  }
  
  const username = email.split('@')[0];
  
  if (username.length < 1) {
    return { valid: false, message: 'Email username cannot be empty' };
  }
  
  if (!/^[a-zA-Z0-9.]+$/.test(username)) {
    return { valid: false, message: 'Email contains invalid characters' };
  }
  
  if (username.includes('..')) {
    return { valid: false, message: 'Consecutive dots not allowed in email' };
  }
  
  if (username.startsWith('.') || username.endsWith('.')) {
    return { valid: false, message: 'Email cannot start or end with a dot' };
  }
  
  return { valid: true, message: 'Valid Gmail format' };
};