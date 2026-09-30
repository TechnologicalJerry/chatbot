import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type MemoryDocument = Memory & Document;

@Schema({ timestamps: true })
export class Memory {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true, index: true })
  userId!: string;

  @Prop({ required: true })
  fact!: string;

  @Prop({ default: 'user_provided', enum: ['user_provided', 'extracted'] })
  source!: string;

  @Prop({ default: 1.0 })
  confidence!: number;
}

export const MemorySchema = SchemaFactory.createForClass(Memory);
