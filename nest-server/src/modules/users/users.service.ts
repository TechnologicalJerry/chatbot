import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from './user.schema';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async create(data: { email: string; password?: string; name: string; role?: string; tier?: string }) {
    const existing = await this.userModel.findOne({ email: data.email });
    if (existing) {
      throw new ConflictException('User with this email already exists');
    }

    const hashedPassword = data.password ? await bcrypt.hash(data.password, 10) : 'NO_PASSWORD';
    const user = new this.userModel({
      email: data.email,
      password: hashedPassword,
      name: data.name,
      role: data.role || 'user',
      tier: data.tier || 'free',
    });

    await user.save();
    return this.sanitize(user);
  }

  async findByEmail(email: string, includePassword = false) {
    const query = this.userModel.findOne({ email });
    if (includePassword) {
      query.select('+password');
    }
    return query.exec();
  }

  async findById(id: string) {
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.sanitize(user);
  }

  sanitize(user: UserDocument) {
    const obj = user.toObject();
    delete (obj as any).password;
    return obj;
  }
}
