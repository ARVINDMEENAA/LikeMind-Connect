import mongoose from 'mongoose';

const blockSchema = new mongoose.Schema({
  blocker: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  blocked: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

// Ensure a user can't block the same person twice
blockSchema.index({ blocker: 1, blocked: 1 }, { unique: true });

export default mongoose.model('Block', blockSchema);