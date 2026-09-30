import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type ProductDocument = Product & Document;

@Schema({ timestamps: true })
export class Product {
  @Prop({ required: true, index: true })
  title!: string;

  @Prop({ required: true })
  description!: string;

  @Prop({ required: true })
  price!: number;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true, index: true })
  user!: string;
}

export const ProductSchema = SchemaFactory.createForClass(Product);
