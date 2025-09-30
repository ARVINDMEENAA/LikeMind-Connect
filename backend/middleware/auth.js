import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const auth = async (req, res, next) => {
  try {
    // Try to get token from Authorization header first, then from cookie
    let token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      token = req.cookies?.authToken;
    }
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid token' });
    }
    
    // Check if user is still verified
    if (!user.isVerified) {
      return res.status(401).json({ message: 'Account not verified' });
    }
    
    req.user = { userId: user._id, email: user.email };
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};