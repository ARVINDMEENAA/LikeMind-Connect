import mongoose from 'mongoose';

const matchSchema = new mongoose.Schema({
  user1_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  user2_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  match_score: {
    type: Number,
    required: true
  },
  chat_request_status: {
    type: String,
    enum: ['none', 'pending', 'accepted', 'rejected'],
    default: 'none'
  }
}, {
  timestamps: true
});

export default mongoose.model('Match', matchSchema);