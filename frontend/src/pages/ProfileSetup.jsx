import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload } from 'lucide-react';
import HobbyInput from '../components/HobbyInput';
import api from '../utils/api';

const ProfileSetup = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    hobbies: [],
    profilePicture: null,
    age: '',
    gender: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/hobby/update', {
        hobbies: formData.hobbies
      });
      navigate('/dashboard');
    } catch (error) {
      console.error('Profile setup failed:', error);
    }
    setLoading(false);
  };

  const handleFileChange = (e) => {
    setFormData({ ...formData, profilePicture: e.target.files[0] });
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
            Complete Your Profile
          </h2>
          <p className="text-gray-600">Tell us more about yourself</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Hobbies</label>
            <HobbyInput
              hobbies={formData.hobbies}
              onChange={(hobbies) => setFormData({ ...formData, hobbies })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Profile Picture (Optional)</label>
            <div className="relative">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                id="profilePicture"
              />
              <label
                htmlFor="profilePicture"
                className="w-full px-4 py-3 bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl hover:border-purple-500 transition-all duration-200 cursor-pointer flex items-center justify-center gap-2"
              >
                <Upload size={20} />
                {formData.profilePicture ? formData.profilePicture.name : 'Upload Image'}
              </label>
            </div>
          </div>

          <div>
            <input
              type="number"
              name="age"
              placeholder="Age"
              value={formData.age}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent rounded-xl focus:border-purple-500 focus:bg-white transition-all duration-200 outline-none"
            />
          </div>

          <div>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent rounded-xl focus:border-purple-500 focus:bg-white transition-all duration-200 outline-none"
            >
              <option value="">Select Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-3 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save & Continue'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProfileSetup;