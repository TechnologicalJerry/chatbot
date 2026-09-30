import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type MessageDocument = Message & Document;

@Schema({ timestamps: true })
export class Message {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Conversation', required: true, index: true })
  conversationId!: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true, index: true })
  userId!: string;

  @Prop({ required: true, enum: ['user', 'assistant', 'system', 'tool'] })
  role!: string;

  @Prop({ required: true })
  content!: string;

  @Prop({ type: Object, default: {} })
  metadata!: Record<string, any>;
}

export const MessageSchema = SchemaFactory.createForClass(Message);
