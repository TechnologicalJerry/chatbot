import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage extends Document {
  conversationId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    conversationId: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    role: { type: String, required: true, enum: ['user', 'assistant', 'system', 'tool'] },
    content: { type: String, required: true },
    metadata: { type: Object, default: {} },
  },
  { timestamps: true },
);

export const MessageModel = mongoose.model<IMessage>('Message', MessageSchema);
