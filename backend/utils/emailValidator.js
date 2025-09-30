import dns from 'dns';
import { promisify } from 'util';

const resolveMx = promisify(dns.resolveMx);

// Basic email format validation
export const isValidEmailFormat = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Check if domain has MX record (mail server)
export const hasMxRecord = async (email) => {
  try {
    const domain = email.split('@')[1];
    const mxRecords = await resolveMx(domain);
    return mxRecords && mxRecords.length > 0;
  } catch (error) {
    return false;
  }
};

// Enhanced Gmail validation
export const isValidGmailAccount = async (email) => {
  // Basic format check
  if (!email.toLowerCase().endsWith('@gmail.com')) {
    return { valid: false, reason: 'Not a Gmail address' };
  }
  
  // Check if domain has MX record
  const hasMx = await hasMxRecord(email);
  if (!hasMx) {
    return { valid: false, reason: 'Invalid domain' };
  }
  
  // Additional Gmail-specific checks
  const username = email.split('@')[0];
  
  // Gmail username rules
  if (username.length < 6 || username.length > 30) {
    return { valid: false, reason: 'Invalid Gmail username length' };
  }
  
  // Check for invalid characters
  if (!/^[a-zA-Z0-9.]+$/.test(username)) {
    return { valid: false, reason: 'Invalid characters in Gmail username' };
  }
  
  // Check for consecutive dots
  if (username.includes('..')) {
    return { valid: false, reason: 'Consecutive dots not allowed in Gmail' };
  }
  
  // Check if starts or ends with dot
  if (username.startsWith('.') || username.endsWith('.')) {
    return { valid: false, reason: 'Gmail username cannot start or end with dot' };
  }
  
  return { valid: true, reason: 'Valid Gmail format' };
};

// Free email validation service (you can use services like Hunter.io, ZeroBounce, etc.)
export const validateEmailWithService = async (email) => {
  // This is a placeholder - you can integrate with actual email validation services
  // For now, just doing basic checks
  
  try {
    const formatValid = isValidEmailFormat(email);
    if (!formatValid) {
      return { valid: false, reason: 'Invalid email format' };
    }
    
    const mxValid = await hasMxRecord(email);
    if (!mxValid) {
      return { valid: false, reason: 'Domain does not accept emails' };
    }
    
    return { valid: true, reason: 'Email appears valid' };
  } catch (error) {
    return { valid: false, reason: 'Validation service error' };
  }
};