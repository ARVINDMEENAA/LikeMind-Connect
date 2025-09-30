import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';

const EmailVerification = () => {
  console.log('EmailVerification component loaded');
  
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying');
  const [message, setMessage] = useState('');

  console.log('Token from URL:', token);

  useEffect(() => {
    console.log('useEffect running with token:', token);
    
    const verifyEmail = async () => {
      console.log('Starting verification for token:', token);
      try {
        const response = await axios.get(`http://localhost:5000/api/auth/verify-email/${token}`);
        console.log('Verification SUCCESS:', response.data);
        setStatus('success');
        setMessage(response.data.message);
        setTimeout(() => {
          console.log('Redirecting to login...');
          navigate('/login');
        }, 3000);
      } catch (error) {
        console.error('Verification ERROR:', error);
        setStatus('error');
        setMessage(error.response?.data?.message || 'Verification failed');
      }
    };

    if (token) {
      verifyEmail();
    } else {
      console.log('No token found');
      setStatus('error');
      setMessage('No verification token provided');
    }
  }, [token, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Email Verification
          </h2>
          
          {status === 'verifying' && (
            <div className="mt-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Verifying your email...</p>
            </div>
          )}
          
          {status === 'success' && (
            <div className="mt-4">
              <div className="text-green-600 text-5xl">✓</div>
              <p className="mt-2 text-green-600 font-medium">{message}</p>
              <p className="mt-2 text-gray-600">Redirecting to login...</p>
            </div>
          )}
          
          {status === 'error' && (
            <div className="mt-4">
              <div className="text-red-600 text-5xl">✗</div>
              <p className="mt-2 text-red-600 font-medium">{message}</p>
              <button
                onClick={() => navigate('/login')}
                className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
              >
                Go to Login
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmailVerification;