import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  isVerified: { type: Boolean, default: false },
  emailVerificationToken: { type: String },
  emailVerificationExpires: { type: Date },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
  lastLogin: { type: Date },
  isFirstLogin: { type: Boolean, default: true },
  age: { type: Number },
  gender: { type: String },
  bio: { type: String },
  location: { type: String },
  occupation: { type: String },
  hobbies: { type: [String], default: [] },      // Array of strings
  embedding: { type: [Number], default: [] },    // Array of numbers
  profile_picture: { type: String }
}, { timestamps: true });

// Password comparison method (safe)
userSchema.methods.comparePassword = async function(password) {
  // Defensive check: ensure both passwords exist and are strings
  if (!password || typeof password !== 'string' || !this.password || typeof this.password !== 'string') {
    // Return false instead of throwing to avoid bcrypt error
    return false;
  }
  return bcrypt.compare(password, this.password);
};

export default mongoose.model('User', userSchema);
