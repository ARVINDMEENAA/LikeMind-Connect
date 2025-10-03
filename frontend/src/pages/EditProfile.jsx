// ...rest of your imports and component code

const handleSave = async () => {
  setLoading(true);
  try {
    const data = new FormData();
    data.append('name', formData.name);
    data.append('age', formData.age);
    data.append('bio', formData.bio);
    data.append('location', formData.location);
    data.append('occupation', formData.occupation);
    data.append('hobbies', JSON.stringify(formData.hobbies));
    if (formData.profilePicture) {
      data.append('profile_picture', formData.profilePicture); // Image file
    }

    // DO NOT pass headers here! Axios will set them automatically.
    const response = await api.put('/profile/update', data);

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

// ...rest of your component code (no other change required)
