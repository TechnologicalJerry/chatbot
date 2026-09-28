import mongoose from "mongoose";
import { UserDocument } from "../users/user.model";

export type DocumentSourceType = "text" | "markdown" | "file";
export type DocumentStatus = "pending" | "processing" | "ready" | "failed" | "deleted";

export interface KnowledgeDocumentInput {
  ownerId: UserDocument["_id"];
  title: string;
  sourceType?: DocumentSourceType;
  sourceReference?: string;
  contentHash: string;
  status?: DocumentStatus;
  chunkCount?: number;
  metadata?: Record<string, unknown>;
}

export interface KnowledgeDocumentDocument extends mongoose.Document {
  ownerId: UserDocument["_id"];
  title: string;
  sourceType: DocumentSourceType;
  sourceReference?: string;
  contentHash: string;
  status: DocumentStatus;
  chunkCount: number;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const knowledgeDocumentSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 300,
    },
    sourceType: {
      type: String,
      enum: ["text", "markdown", "file"],
      default: "text",
      required: true,
    },
    sourceReference: {
      type: String,
      default: null,
    },
    contentHash: {
      type: String,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["pending", "processing", "ready", "failed", "deleted"],
      default: "pending",
      required: true,
    },
    chunkCount: {
      type: Number,
      default: 0,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
knowledgeDocumentSchema.index({ ownerId: 1, status: 1, createdAt: -1 });
knowledgeDocumentSchema.index({ ownerId: 1, contentHash: 1, status: 1 });

const KnowledgeDocumentModel = mongoose.model<KnowledgeDocumentDocument>(
  "KnowledgeDocument",
  knowledgeDocumentSchema
);

export default KnowledgeDocumentModel;
export { KnowledgeDocumentModel };
