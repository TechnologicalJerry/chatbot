import mongoose, { Schema, Document } from 'mongoose';

export interface ISession extends Document {
  user: mongoose.Types.ObjectId;
  valid: boolean;
  userAgent?: string;
  ipAddress?: string;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SessionSchema = new Schema<ISession>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    valid: { type: Boolean, default: true, required: true },
    userAgent: { type: String },
    ipAddress: { type: String },
    expiresAt: { type: Date },
  },
  { timestamps: true },
);

export const SessionModel = mongoose.model<ISession>('Session', SessionSchema);
