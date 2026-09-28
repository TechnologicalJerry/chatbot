import mongoose, { Schema, Document } from 'mongoose';

export interface IConversation extends Document {
  user: mongoose.Types.ObjectId;
  title: string;
  archived: boolean;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const ConversationSchema = new Schema<IConversation>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, default: 'New Conversation' },
    archived: { type: Boolean, default: false },
    metadata: { type: Object, default: {} },
  },
  { timestamps: true },
);

export const ConversationModel = mongoose.model<IConversation>('Conversation', ConversationSchema);
