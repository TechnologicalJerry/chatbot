import mongoose, { Schema, Document } from 'mongoose';

export interface IMemory extends Document {
  userId: mongoose.Types.ObjectId;
  fact: string;
  source: 'user_provided' | 'extracted';
  confidence: number;
  createdAt: Date;
  updatedAt: Date;
}

const MemorySchema = new Schema<IMemory>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    fact: { type: String, required: true },
    source: { type: String, default: 'user_provided', enum: ['user_provided', 'extracted'] },
    confidence: { type: Number, default: 1.0 },
  },
  { timestamps: true },
);

export const MemoryModel = mongoose.model<IMemory>('Memory', MemorySchema);
