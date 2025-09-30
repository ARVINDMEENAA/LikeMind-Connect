import React, { useState, useEffect } from 'react';
import { Camera, Save, User, MapPin, Briefcase } from 'lucide-react';
import HobbyInput from '../components/HobbyInput';
import api from '../utils/api';

const EditProfile = () => {
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    bio: '',
    location: '',
    occupation: '',
    hobbies: [],
    profilePicture: null
  });
  const [loading, setLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  // Load current profile data
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await api.get('/profile');
        const profile = response.data;
        setFormData({
          name: profile.name || '',
          age: profile.age || '',
          bio: profile.bio || '',
          location: profile.location || '',
          occupation: profile.occupation || '',
          hobbies: Array.isArray(profile.hobbies) ? profile.hobbies : [],
          profilePicture: null
        });
        if (profile.profile_picture) {
          setPreviewImage(profile.profile_picture);
        }
      } catch (error) {
        console.error('Failed to load profile:', error);
      }
    };
    loadProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, profilePicture: file }));
      const reader = new FileReader();
      reader.onload = (e) => setPreviewImage(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleHobbiesChange = (hobbies) => {
    console.log('Hobbies changed:', hobbies);
    setFormData(prev => ({ ...prev, hobbies }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const profileData = {
        name: formData.name,
        age: formData.age,
        bio: formData.bio,
        location: formData.location,
        occupation: formData.occupation,
        hobbies: formData.hobbies,
        profile_picture: previewImage
      };

      console.log('Sending profile data:', profileData);
      console.log('Hobbies being sent:', formData.hobbies);

      const response = await api.put('/profile/update', profileData);
      
      // Backend sends success message, not success flag
      if (response.data.message === 'Profile updated successfully') {
        alert('Profile updated successfully!');
      } else {
        alert(response.data.message || 'Profile updated!');
      }
    } catch (error) {
      console.error('Save failed:', error);
      alert('Failed to save changes. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-8">
          Edit Profile
        </h1>
        
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Profile Picture Section */}
          <div className="text-center mb-8">
            <div className="relative inline-block">
              <div className="w-32 h-32 rounded-full overflow-hidden bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center text-white text-4xl font-bold">
                {previewImage ? (
                  <img src={previewImage} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User size={48} />
                )}
              </div>
              <label className="absolute bottom-0 right-0 bg-green-500 hover:bg-green-600 text-white p-2 rounded-full cursor-pointer transition-colors duration-200">
                <Camera size={20} />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
              </label>
            </div>
            <p className="text-gray-600 mt-2">Click the camera icon to update your photo</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Personal Info */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent rounded-xl focus:border-green-500 focus:bg-white transition-all duration-200 outline-none"
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Age</label>
                <input
                  type="number"
                  name="age"
                  value={formData.age}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent rounded-xl focus:border-green-500 focus:bg-white transition-all duration-200 outline-none"
                  placeholder="Enter your age"
                  min="18"
                  max="100"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                  <MapPin size={16} className="mr-1" />
                  Location
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent rounded-xl focus:border-green-500 focus:bg-white transition-all duration-200 outline-none"
                  placeholder="City, State"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                  <Briefcase size={16} className="mr-1" />
                  Occupation
                </label>
                <input
                  type="text"
                  name="occupation"
                  value={formData.occupation}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent rounded-xl focus:border-green-500 focus:bg-white transition-all duration-200 outline-none"
                  placeholder="Your job title"
                />
              </div>
            </div>

            {/* Bio and Hobbies */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Bio</label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  rows="4"
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent rounded-xl focus:border-green-500 focus:bg-white transition-all duration-200 outline-none resize-none"
                  placeholder="Tell others about yourself..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Hobbies & Interests</label>
                <HobbyInput 
                  hobbies={formData.hobbies} 
                  onChange={handleHobbiesChange}
                />

              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="mt-8 text-center">
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex items-center justify-center gap-3 mx-auto px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:transform-none"
            >
              <Save size={20} />
              {loading ? 'Saving Changes...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditProfile;