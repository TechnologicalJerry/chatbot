import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, isValidObjectId } from 'mongoose';
import { Conversation, ConversationDocument } from './conversation.schema';

@Injectable()
export class ConversationsService {
  constructor(
    @InjectModel(Conversation.name) private conversationModel: Model<ConversationDocument>,
  ) {}

  async create(userId: string, title?: string) {
    const conversation = new this.conversationModel({
      user: userId,
      title: title || 'New Conversation',
    });
    return conversation.save();
  }

  async findUserConversations(userId: string, query: { page?: number; limit?: number } = {}) {
    const page = query.page || 1;
    const limit = query.limit || 50;
    const skip = (page - 1) * limit;

    const filter = { user: userId, archived: { $ne: true } };

    const [items, total] = await Promise.all([
      this.conversationModel.find(filter).sort({ updatedAt: -1 }).skip(skip).limit(limit).exec(),
      this.conversationModel.countDocuments(filter),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOneUserConversation(conversationId: string, userId: string) {
    if (!isValidObjectId(conversationId)) {
      throw new NotFoundException('Conversation not found');
    }

    const conversation = await this.conversationModel.findOne({
      _id: conversationId,
      user: userId,
    }).exec();

    if (!conversation) {
      // IDOR protection: return 404 instead of 403
      throw new NotFoundException('Conversation not found');
    }

    return conversation;
  }

  async updateTitle(conversationId: string, userId: string, title: string) {
    const conversation = await this.findOneUserConversation(conversationId, userId);
    conversation.title = title;
    return conversation.save();
  }

  async archive(conversationId: string, userId: string) {
    const conversation = await this.findOneUserConversation(conversationId, userId);
    conversation.archived = true;
    return conversation.save();
  }

  async delete(conversationId: string, userId: string) {
    await this.findOneUserConversation(conversationId, userId);
    await this.conversationModel.findByIdAndDelete(conversationId).exec();
    return { success: true, message: 'Conversation deleted' };
  }
}
