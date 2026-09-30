import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true, index: true })
  email!: string;

  @Prop({ required: true, select: false })
  password!: string;

  @Prop({ required: true })
  name!: string;

  @Prop({ default: 'user', enum: ['user', 'admin'] })
  role!: string;

  @Prop({ default: 'free', enum: ['free', 'pro', 'enterprise'] })
  tier!: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
