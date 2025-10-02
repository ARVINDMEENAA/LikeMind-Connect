import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

export const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFirstLogin, setIsFirstLogin] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = sessionStorage.getItem('token');
        if (token) {
          const response = await api.get('/auth/me');
          setUser(response.data);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        sessionStorage.removeItem('token');
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (formData) => {
    try {
      console.log('🔑 AuthContext - Login attempt with:', { email: formData.email });
      
      // Validate input
      if (!formData.email || !formData.password) {
        throw new Error('Email and password are required');
      }
      
      // Clean the form data
      const cleanFormData = {
        email: formData.email.trim().toLowerCase(),
        password: formData.password
      };
      
      console.log('🔑 AuthContext - Sending request to /auth/login');
      const response = await api.post('/auth/login', cleanFormData);
      console.log('🔑 AuthContext - Login response:', response.data);
      
      const { success, token, user: userData, redirectTo, isFirstLogin: firstLogin } = response.data;
      
      if (!success || !token) {
        throw new Error('Login failed - invalid response from server');
      }
      
      // Store token in sessionStorage for client-side access
      sessionStorage.setItem('token', token);
      
      // Update user state and first login flag
      setUser(userData);
      setIsFirstLogin(firstLogin || false);
      
      // Navigate to dashboard or specified redirect URL
      const redirectPath = redirectTo || '/dashboard';
      navigate(redirectPath);
      
      console.log('🔑 AuthContext - Login successful, redirecting to:', redirectPath);
      return response.data;
    } catch (error) {
      console.error('🔑 AuthContext - Login error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Login failed';
      throw new Error(errorMessage);
    }
  };

  const signup = async (formData) => {
    try {
      const response = await api.post('/auth/signup', formData);
      // Signup with email verification doesn't return token immediately
      // User needs to verify email first
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Signup failed';
      throw new Error(errorMessage);
    }
  };

  const logout = async () => {
    try {
      // Call logout endpoint to clear server-side session/cookie
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    }
    
    // Clear client-side state
    setUser(null);
    sessionStorage.removeItem('token');
    
    // Clear any cached user data
    sessionStorage.removeItem('user');
    
    // Navigate to home page
    navigate('/');
    
    console.log('🔑 AuthContext - Logout successful');
  };

  const isAuthenticated = () => {
    return !!user;
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      signup,
      logout,
      isAuthenticated,
      loading,
      isFirstLogin,
      setIsFirstLogin
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
