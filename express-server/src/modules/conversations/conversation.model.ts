import mongoose from "mongoose";

export interface ConversationDocument extends mongoose.Document {
  userId: string;
  title: string;
  status: "active" | "archived" | "deleted";
  metadata?: Record<string, any>;
  messageCount: number;
  lastMessageAt?: Date;
  summary?: string;
  summaryLastMessageCount?: number;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const conversationSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true, default: "New Conversation" },
    status: {
      type: String,
      enum: ["active", "archived", "deleted"],
      default: "active",
      index: true,
    },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    messageCount: { type: Number, default: 0 },
    lastMessageAt: { type: Date },
    summary: { type: String },
    summaryLastMessageCount: { type: Number, default: 0 },
    deletedAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

conversationSchema.index({ userId: 1, status: 1, updatedAt: -1, _id: -1 });

export const ConversationModel = mongoose.model<ConversationDocument>("Conversation", conversationSchema);
export default ConversationModel;
