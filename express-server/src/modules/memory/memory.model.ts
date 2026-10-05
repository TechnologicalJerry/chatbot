import mongoose from "mongoose";

export interface MemoryDocument extends mongoose.Document {
  userId: string;
  conversationId?: string;
  type: "preference" | "fact" | "goal" | "profile";
  key: string;
  value: string;
  source: string;
  confidence: number;
  status: "active" | "superseded" | "deleted";
  createdAt: Date;
  updatedAt: Date;
}

const memorySchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    conversationId: { type: String },
    type: {
      type: String,
      enum: ["preference", "fact", "goal", "profile"],
      required: true,
      index: true,
    },
    key: { type: String, required: true },
    value: { type: String, required: true },
    source: { type: String, default: "manual" },
    confidence: { type: Number, default: 1.0 },
    status: {
      type: String,
      enum: ["active", "superseded", "deleted"],
      default: "active",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

memorySchema.index({ userId: 1, status: 1, type: 1, key: 1 });

export const MemoryModel = mongoose.model<MemoryDocument>("Memory", memorySchema);
export default MemoryModel;
