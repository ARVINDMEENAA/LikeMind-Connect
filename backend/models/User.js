import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  passwordHash: { type: String, required: true },
  isVerified: { type: Boolean, default: false },
  bio: { type: String, default: '' },
  location: { type: String, default: '' },
  occupation: { type: String, default: '' },
  age: { type: Number },
  gender: { type: String, default: '' },
  hobbies: { type: [String], default: [] },
  profile_picture: { type: String, default: '' },
  embedding: { type: mongoose.Schema.Types.Mixed },
  hobbyEmbeddings: { type: Array, default: [] },
  // ...keep the rest
  emailVerificationToken: { type: String },
  emailVerificationExpires: { type: Date },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
  lastLogin: { type: Date },
  isFirstLogin: { type: Boolean, default: true }
}, { timestamps: true });

// Password comparison method
userSchema.methods.comparePassword = async function(password) {
  return bcrypt.compare(password, this.passwordHash);
};

export default mongoose.model('User', userSchema);
