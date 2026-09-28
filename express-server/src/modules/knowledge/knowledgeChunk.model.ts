import mongoose from "mongoose";
import { UserDocument } from "../users/user.model";
import { KnowledgeDocumentDocument } from "./knowledgeDocument.model";

export interface KnowledgeChunkInput {
  documentId: KnowledgeDocumentDocument["_id"];
  ownerId: UserDocument["_id"];
  sequence: number;
  text: string;
  embedding: number[];
  tokenCount?: number;
  metadata?: Record<string, unknown>;
}

export interface KnowledgeChunkDocument extends mongoose.Document {
  documentId: KnowledgeDocumentDocument["_id"];
  ownerId: UserDocument["_id"];
  sequence: number;
  text: string;
  embedding: number[];
  tokenCount: number;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const knowledgeChunkSchema = new mongoose.Schema(
  {
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "KnowledgeDocument",
      required: true,
      index: true,
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    sequence: {
      type: Number,
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
    embedding: {
      type: [Number],
      required: true,
    },
    tokenCount: {
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
knowledgeChunkSchema.index({ ownerId: 1, documentId: 1, sequence: 1 });

const KnowledgeChunkModel = mongoose.model<KnowledgeChunkDocument>(
  "KnowledgeChunk",
  knowledgeChunkSchema
);

export default KnowledgeChunkModel;
export { KnowledgeChunkModel };
