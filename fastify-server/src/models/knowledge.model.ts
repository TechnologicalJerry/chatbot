import mongoose, { Schema, Document } from 'mongoose';

export interface IKnowledgeDocument extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  content: string;
  chunkCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IKnowledgeChunk extends Document {
  documentId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  content: string;
  vector: number[];
  createdAt: Date;
  updatedAt: Date;
}

const KnowledgeDocumentSchema = new Schema<IKnowledgeDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true },
    content: { type: String, required: true },
    chunkCount: { type: Number, default: 0 },
  },
  { timestamps: true },
);

const KnowledgeChunkSchema = new Schema<IKnowledgeChunk>(
  {
    documentId: { type: Schema.Types.ObjectId, ref: 'KnowledgeDocument', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    content: { type: String, required: true },
    vector: { type: [Number], default: [] },
  },
  { timestamps: true },
);

export const KnowledgeDocumentModel = mongoose.model<IKnowledgeDocument>('KnowledgeDocument', KnowledgeDocumentSchema);
export const KnowledgeChunkModel = mongoose.model<IKnowledgeChunk>('KnowledgeChunk', KnowledgeChunkSchema);
