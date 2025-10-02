import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { validateGmailFormat } from '../utils/emailValidator';

const Signup = () => {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordErrors, setPasswordErrors] = useState({});

  const validatePassword = (password) => {
    const errors = {};
    if (password.length < 8) errors.minLength = 'At least 8 characters';
    if (!/[A-Z]/.test(password)) errors.hasCapital = '1 capital letter';
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) errors.hasSpecial = '1 special character';
    return errors;
  };

  const handleEmailChange = (e) => {
    const email = e.target.value;
    setFormData({...formData, email});
    
    if (email) {
      const validation = validateGmailFormat(email);
      setEmailError(validation.valid ? '' : validation.message);
    } else {
      setEmailError('');
    }
  };

  const handlePasswordChange = (e) => {
    const password = e.target.value;
    setFormData({...formData, password});
    setPasswordErrors(validatePassword(password));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Frontend validations
    const emailValidation = validateGmailFormat(formData.email);
    if (!emailValidation.valid) {
      setEmailError(emailValidation.message);
      return;
    }
    
    const passwordValidation = validatePassword(formData.password);
    if (Object.keys(passwordValidation).length > 0) {
      setPasswordErrors(passwordValidation);
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const { confirmPassword, ...signupData } = formData;
      const response = await signup(signupData);
      setSuccess(response.message || 'Account created! Please check your email to verify your account.');
      setFormData({ name: '', email: '', password: '', confirmPassword: '' });
    } catch (err) {
      setError(err.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-400 via-blue-400 to-teal-500 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl p-8">
        <button 
          onClick={() => navigate('/')}
          className="mb-4 text-green-600 hover:text-green-700 font-semibold transition-colors duration-200"
        >
          ← Back to Home
        </button>
        
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-2">
            Join Us Today
          </h2>
          <p className="text-gray-600">Create your account and start connecting</p>
        </div>
        
        {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-xl">{error}</div>}
        {success && <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-xl">{success}</div>}
        
        <form onSubmit={handleSubmit} className="space-y-5" autoComplete="off">
          <input
            type="text"
            placeholder="Full Name"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            autoComplete="off"
            className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent rounded-xl focus:border-green-500 focus:bg-white transition-all duration-200 outline-none"
            required
          />
          <div>
            <input
              type="email"
              placeholder="Email Address (Gmail only)"
              value={formData.email}
              onChange={handleEmailChange}
              autoComplete="new-email"
              className={`w-full px-4 py-3 bg-gray-50 border-2 rounded-xl focus:bg-white transition-all duration-200 outline-none ${
                emailError ? 'border-red-500 focus:border-red-500' : 'border-transparent focus:border-green-500'
              }`}
              required
            />
            {emailError && (
              <p className="text-red-500 text-sm mt-1">{emailError}</p>
            )}
          </div>
          <div>
            <input
              type="password"
              placeholder="Password (min 8 chars, 1 capital, 1 special)"
              value={formData.password}
              onChange={handlePasswordChange}
              autoComplete="new-password"
              className={`w-full px-4 py-3 bg-gray-50 border-2 rounded-xl focus:bg-white transition-all duration-200 outline-none ${
                Object.keys(passwordErrors).length > 0 ? 'border-red-500 focus:border-red-500' : 'border-transparent focus:border-green-500'
              }`}
              required
            />
            {Object.keys(passwordErrors).length > 0 && (
              <div className="text-red-500 text-sm mt-1">
                Missing: {Object.values(passwordErrors).join(', ')}
              </div>
            )}
          </div>
          <input
            type="password"
            placeholder="Confirm Password"
            value={formData.confirmPassword}
            onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
            autoComplete="new-password"
            className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent rounded-xl focus:border-green-500 focus:bg-white transition-all duration-200 outline-none"
            required
          />
          <button 
            type="submit"
            disabled={loading || emailError || Object.keys(passwordErrors).length > 0}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold py-3 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50"
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>
        
        <div className="text-center mt-6">
          <p className="text-gray-600">
            Already have an account?{' '}
            <button
              onClick={() => navigate('/login')}
              className="text-green-600 hover:text-green-700 font-semibold transition-colors duration-200"
            >
              Sign in here
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
