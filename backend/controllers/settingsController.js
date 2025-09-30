import User from '../models/User.js';

export const getSettings = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const updateSettings = async (req, res) => {
  try {
    const userId = req.user.userId;
    const updates = req.body;
    
    const user = await User.findByIdAndUpdate(userId, updates, { new: true }).select('-password');
    res.json({ message: 'Settings updated successfully', user });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const logout = async (req, res) => {
  res.json({ message: 'Logged out successfully' });
};