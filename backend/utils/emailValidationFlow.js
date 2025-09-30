import dns from 'dns';
import { promisify } from 'util';
import User from '../models/User.js';

const resolveMx = promisify(dns.resolveMx);

// Frontend-style email format validation
export const validateEmailFormat = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.endsWith('@gmail.com');
};

// Backend Gmail domain validation
export const validateGmailDomain = (email) => {
  if (!email.toLowerCase().endsWith('@gmail.com')) {
    return { valid: false, reason: 'Only Gmail accounts are allowed' };
  }
  
  const username = email.split('@')[0];
  
  // Gmail username validation rules
  if (username.length < 1 || username.length > 64) {
    return { valid: false, reason: 'Invalid Gmail username length' };
  }
  
  if (!/^[a-zA-Z0-9.]+$/.test(username)) {
    return { valid: false, reason: 'Invalid characters in Gmail username' };
  }
  
  if (username.includes('..')) {
    return { valid: false, reason: 'Consecutive dots not allowed' };
  }
  
  if (username.startsWith('.') || username.endsWith('.')) {
    return { valid: false, reason: 'Username cannot start or end with dot' };
  }
  
  return { valid: true };
};

// Database check for existing email
export const checkEmailInDatabase = async (email) => {
  const trimmedEmail = email.toLowerCase().trim();
  const existingUser = await User.findOne({ 
    $or: [
      { email: trimmedEmail },
      { email: `"${trimmedEmail}"` },
      { email: `'${trimmedEmail}'` }
    ]
  });
  
  return { exists: !!existingUser, user: existingUser };
};

// Optional MX record check
export const checkMxRecord = async (email) => {
  try {
    const domain = email.split('@')[1];
    const mxRecords = await resolveMx(domain);
    return { valid: mxRecords && mxRecords.length > 0, records: mxRecords };
  } catch (error) {
    return { valid: false, error: error.message };
  }
};

// Complete email validation flow
export const validateEmailFlow = async (email) => {
  const result = {
    valid: false,
    step: '',
    reason: '',
    details: {}
  };
  
  // Step 1: Frontend format check
  result.step = 'format_check';
  if (!validateEmailFormat(email)) {
    result.reason = 'Invalid email format or not a Gmail address';
    return result;
  }
  result.details.formatValid = true;
  
  // Step 2: Backend Gmail domain validation
  result.step = 'domain_check';
  const domainCheck = validateGmailDomain(email);
  if (!domainCheck.valid) {
    result.reason = domainCheck.reason;
    return result;
  }
  result.details.domainValid = true;
  
  // Step 3: Database check
  result.step = 'database_check';
  const dbCheck = await checkEmailInDatabase(email);
  if (dbCheck.exists) {
    result.reason = 'Email already registered';
    result.details.existingUser = true;
    return result;
  }
  result.details.databaseValid = true;
  
  // Step 4: Optional MX record check
  result.step = 'mx_check';
  const mxCheck = await checkMxRecord(email);
  result.details.mxValid = mxCheck.valid;
  result.details.mxRecords = mxCheck.records;
  
  if (!mxCheck.valid) {
    console.warn(`MX check failed for ${email}:`, mxCheck.error);
    // Don't block signup for MX failures as Gmail always has MX records
  }
  
  result.valid = true;
  result.step = 'complete';
  result.reason = 'Email validation passed';
  
  return result;
};