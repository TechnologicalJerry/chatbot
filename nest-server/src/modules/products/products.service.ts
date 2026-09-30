import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product, ProductDocument } from './product.schema';

@Injectable()
export class ProductsService {
  constructor(@InjectModel(Product.name) private productModel: Model<ProductDocument>) {}

  async create(data: { title: string; description: string; price: number; user: string }) {
    const product = new this.productModel(data);
    return product.save();
  }

  async findAll(query: { page?: number; limit?: number } = {}) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.productModel.find().skip(skip).limit(limit).exec(),
      this.productModel.countDocuments(),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findById(id: string) {
    const product = await this.productModel.findById(id).exec();
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return product;
  }

  async update(id: string, userId: string, data: Partial<{ title: string; description: string; price: number }>) {
    const product = await this.findById(id);
    if (product.user.toString() !== userId) {
      throw new ForbiddenException('Cannot edit product owned by another user');
    }
    Object.assign(product, data);
    return product.save();
  }

  async delete(id: string, userId: string) {
    const product = await this.findById(id);
    if (product.user.toString() !== userId) {
      throw new ForbiddenException('Cannot delete product owned by another user');
    }
    await this.productModel.findByIdAndDelete(id).exec();
    return { success: true, message: 'Product deleted successfully' };
  }
}
