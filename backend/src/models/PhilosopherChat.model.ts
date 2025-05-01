import mongoose, { Schema, Document } from 'mongoose';

export interface IPhilosopherChat extends Document {
  userId: string;
  philosopherId: string;
  philosopherName: string;
  philosopherImage?: string;
  messages: Array<{
    role: 'user' | 'philosopher';
    content: string;
    timestamp: Date;
  }>;
  lastMessageTime: Date;
  unreadCount: number;
}

const PhilosopherChatSchema: Schema = new Schema({
  userId: { type: String, required: true },
  philosopherId: { type: String, required: true },
  philosopherName: { type: String, required: true },
  philosopherImage: { type: String },
  messages: [{
    role: { type: String, enum: ['user', 'philosopher'], required: true },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
  }],
  lastMessageTime: { type: Date, default: Date.now },
  unreadCount: { type: Number, default: 0 }
}, {
  timestamps: true
});

// Create compound index for faster queries
PhilosopherChatSchema.index({ userId: 1, philosopherId: 1 }, { unique: true });

export default mongoose.model<IPhilosopherChat>('PhilosopherChat', PhilosopherChatSchema); 