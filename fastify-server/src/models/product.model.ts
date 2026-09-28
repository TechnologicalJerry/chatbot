import mongoose, { Schema, Document } from 'mongoose';

export interface IProduct extends Document {
  title: string;
  description: string;
  price: number;
  user: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    title: { type: String, required: true, index: true },
    description: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  },
  { timestamps: true },
);

export const ProductModel = mongoose.model<IProduct>('Product', ProductSchema);
