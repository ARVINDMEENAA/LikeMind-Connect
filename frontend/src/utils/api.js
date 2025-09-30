import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  withCredentials: true,
  timeout: 300000, // 5 minute timeout for file uploads
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('❌ API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle 401 errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status !== 401) {
      console.error('❌ API Error:', error.response?.data?.message || error.message);
    }
    if (error.response?.status === 401) {
      // Only redirect if we're not already on login/home page
      if (!window.location.pathname.includes('/login') && window.location.pathname !== '/') {
        sessionStorage.removeItem('user');
        sessionStorage.removeItem('token');
        // Clear user state through a custom event
        window.dispatchEvent(new CustomEvent('auth-logout'));
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);

export default api;