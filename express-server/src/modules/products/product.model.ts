import mongoose from "mongoose";
import { nanoid } from "nanoid";

export interface ProductDocument extends mongoose.Document {
  user: mongoose.Types.ObjectId;
  userId?: string;
  productId: string;
  title: string;
  description: string;
  price: number;
  image: string;
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new mongoose.Schema(
  {
    productId: {
      type: String,
      required: true,
      unique: true,
      default: () => `product_${nanoid(10)}`,
    },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    userId: { type: String },
    title: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    image: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

export const ProductModel = mongoose.model<ProductDocument>("Product", productSchema);
export default ProductModel;
