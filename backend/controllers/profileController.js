import User from '../models/User.js';

// ...other code

export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    // Parse hobbies (sent as JSON string)
    let hobbies = [];
    if (req.body.hobbies) {
      try {
        hobbies = JSON.parse(req.body.hobbies);
      } catch (e) {
        hobbies = [];
      }
    }

    const updateData = {
      name: req.body.name,
      age: req.body.age,
      bio: req.body.bio,
      location: req.body.location,
      occupation: req.body.occupation,
      gender: req.body.gender,
      hobbies: hobbies,
    };

    // Handle profile picture upload
    if (req.file) {
      updateData.profile_picture = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    }

    // Remove undefined values from updateData
    Object.keys(updateData).forEach(
      key => updateData[key] === undefined && delete updateData[key]
    );

    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-passwordHash');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'Profile updated successfully', user });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
