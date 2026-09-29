import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type SessionDocument = Session & Document;

@Schema({ timestamps: true })
export class Session {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true, index: true })
  user!: string;

  @Prop({ required: true, default: true })
  valid!: boolean;

  @Prop()
  userAgent?: string;

  @Prop()
  ipAddress?: string;

  @Prop()
  expiresAt?: Date;
}

export const SessionSchema = SchemaFactory.createForClass(Session);
