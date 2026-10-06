import mongoose from "mongoose";

export interface SessionDocument extends mongoose.Document {
  user: mongoose.Types.ObjectId;
  valid: boolean;
  userAgent: string;
  createdAt: Date;
  updatedAt: Date;
}

const sessionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    valid: { type: Boolean, default: true },
    userAgent: { type: String },
  },
  {
    timestamps: true,
  }
);

export const SessionModel = mongoose.model<SessionDocument>("Session", sessionSchema);
export default SessionModel;
