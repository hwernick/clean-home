import mongoose from 'mongoose';

const syncDataSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  key: {
    type: String,
    required: true,
    index: true
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  lastModified: {
    type: Number,
    required: true
  }
}, {
  timestamps: true
});

// Compound index for faster queries
syncDataSchema.index({ userId: 1, key: 1 }, { unique: true });

export const SyncData = mongoose.model('SyncData', syncDataSchema); 