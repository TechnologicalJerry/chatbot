import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type ConversationDocument = Conversation & Document;

@Schema({ timestamps: true })
export class Conversation {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true, index: true })
  user!: string;

  @Prop({ required: true, default: 'New Conversation' })
  title!: string;

  @Prop({ default: false })
  archived!: boolean;

  @Prop({ type: Object, default: {} })
  metadata!: Record<string, any>;
}

export const ConversationSchema = SchemaFactory.createForClass(Conversation);
