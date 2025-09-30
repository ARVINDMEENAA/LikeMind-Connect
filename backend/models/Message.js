import mongoose from 'mongoose';
import { encrypt, decrypt } from '../utils/encryption.js';

const messageSchema = new mongoose.Schema({
  from_user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  to_user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  message_text: {
    type: String,
    required: true
  },
  message_type: {
    type: String,
    enum: ['text', 'image', 'video', 'audio', 'document', 'file', 'ai'],
    default: 'text'
  },
  file_url: {
    type: String
  },
  file_name: {
    type: String
  },
  file_size: {
    type: Number
  },
  public_id: {
    type: String // Cloudinary public ID for file deletion
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  read: {
    type: Boolean,
    default: false
  },
  deleted_for: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  edited: {
    type: Boolean,
    default: false
  },
  original_text: {
    type: String
  }
}, {
  timestamps: true
});

messageSchema.pre('save', function(next) {
  if (this.isModified('message_text')) this.message_text = encrypt(this.message_text);
  if (this.isModified('file_name')) this.file_name = encrypt(this.file_name);
  next();
});

messageSchema.post(['find', 'findOne', 'findOneAndUpdate'], function(docs) {
  const decryptMsg = (doc) => {
    if (doc.message_text) doc.message_text = decrypt(doc.message_text);
    if (doc.file_name) doc.file_name = decrypt(doc.file_name);
  };
  if (Array.isArray(docs)) docs.forEach(decryptMsg);
  else if (docs) decryptMsg(docs);
});

export default mongoose.model('Message', messageSchema);