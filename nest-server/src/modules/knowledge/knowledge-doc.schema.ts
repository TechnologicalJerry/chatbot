import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type KnowledgeDocumentDocument = KnowledgeDocumentClass & Document;

@Schema({ timestamps: true })
export class KnowledgeDocumentClass {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true, index: true })
  userId!: string;

  @Prop({ required: true })
  title!: string;

  @Prop({ required: true })
  content!: string;

  @Prop({ default: 0 })
  chunkCount!: number;
}

export const KnowledgeDocumentSchema = SchemaFactory.createForClass(KnowledgeDocumentClass);
