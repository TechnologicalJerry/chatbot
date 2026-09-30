import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type KnowledgeChunkDocument = KnowledgeChunk & Document;

@Schema({ timestamps: true })
export class KnowledgeChunk {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'KnowledgeDocumentClass', required: true, index: true })
  documentId!: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true, index: true })
  userId!: string;

  @Prop({ required: true })
  content!: string;

  @Prop({ type: [Number], default: [] })
  vector!: number[];
}

export const KnowledgeChunkSchema = SchemaFactory.createForClass(KnowledgeChunk);
