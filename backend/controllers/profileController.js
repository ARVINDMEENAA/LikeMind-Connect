import User from '../models/User.js';

// Example: createProfile function
export const createProfile = async (req, res) => {
  try {
    // Apna logic yahan likho
    res.json({ message: 'Profile created successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { name, age, bio, location, occupation, gender } = req.body;
    const hobbies = req.body.hobbies ? JSON.parse(req.body.hobbies) : [];
    const userId = req.user.userId;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (bio !== undefined) updateData.bio = bio;
    if (location !== undefined) updateData.location = location;
    if (occupation !== undefined) updateData.occupation = occupation;
    if (age !== undefined) updateData.age = parseInt(age);
    if (gender !== undefined) updateData.gender = gender;
    if (hobbies && Array.isArray(hobbies)) updateData.hobbies = hobbies;

    // Handle profile_picture upload
    if (req.file) {
      updateData.profile_picture = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    }

    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'Profile updated successfully', user });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Baaki functions bhi aise hi likho, example:
export const getProfile = async (req, res) => {
  // ...function code
};

export const getRecommendations = async (req, res) => {
  // ...function code
};

export const getUserById = async (req, res) => {
  // ...function code
};

export const getSharedHobbies = async (req, res) => {
  // ...function code
};

export const testRecommendations = async (req, res) => {
  // ...function code
};

export const debugEmbeddings = async (req, res) => {
  // ...function code
};
