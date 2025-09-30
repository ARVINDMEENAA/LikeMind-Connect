import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form data
    if (!formData.email?.trim() || !formData.password?.trim()) {
      setError('Email and password are required');
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    console.log('🔑 Login - Form submission:', { email: formData.email });
    
    try {
      const response = await login(formData);
      setSuccess('Login successful! Redirecting to dashboard...');
      console.log('🔑 Login - Success:', response);
    } catch (err) {
      console.error('🔑 Login - Error:', err);
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-400 via-blue-400 to-teal-500 flex items-center justify-center">
      <div className="max-w-md w-full bg-white/90 backdrop-blur-sm rounded-lg shadow-xl p-6">
        <button 
          onClick={() => navigate('/')}
          className="mb-4 text-green-600 hover:text-green-700 font-semibold"
        >
          ← Back to Home
        </button>
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">Login</h2>
        {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>}
        {success && <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">{success}</div>}
        <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
          <input
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            autoComplete="email"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={formData.password}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            autoComplete="current-password"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            required
          />
          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white py-2 rounded-md transition duration-300 transform hover:scale-105 disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        
        <div className="mt-4 text-center">
          <button
            onClick={() => navigate('/forgot-password')}
            className="text-green-600 hover:text-green-700 text-sm font-medium hover:underline"
          >
            Forgot your password?
          </button>
        </div>
        
        <div className="mt-4 text-center text-sm text-gray-600">
          Don't have an account?{' '}
          <button
            onClick={() => navigate('/signup')}
            className="text-green-600 hover:text-green-700 font-medium hover:underline"
          >
            Sign up here
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;