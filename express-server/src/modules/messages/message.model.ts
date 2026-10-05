import mongoose from "mongoose";

export interface MessageDocument extends mongoose.Document {
  conversationId: string;
  userId: string;
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  contentType: "text" | "json" | "markdown";
  sequence: number;
  status: "pending" | "streaming" | "completed" | "failed" | "cancelled";
  model?: string;
  tokenUsage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  latency?: number;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new mongoose.Schema(
  {
    conversationId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    role: {
      type: String,
      enum: ["system", "user", "assistant", "tool"],
      required: true,
    },
    content: { type: String, required: true, default: "" },
    contentType: {
      type: String,
      enum: ["text", "json", "markdown"],
      default: "text",
    },
    sequence: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending", "streaming", "completed", "failed", "cancelled"],
      default: "completed",
    },
    model: { type: String },
    tokenUsage: {
      promptTokens: { type: Number },
      completionTokens: { type: Number },
      totalTokens: { type: Number },
    },
    latency: { type: Number },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  {
    timestamps: true,
  }
);

messageSchema.index({ conversationId: 1, sequence: -1 }, { unique: true });

export const MessageModel = mongoose.model<MessageDocument>("Message", messageSchema);
export default MessageModel;
