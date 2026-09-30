import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Message, MessageDocument } from './message.schema';
import { ConversationsService } from '../conversations/conversations.service';
import { AbuseDetectorService } from '../../infrastructure/security/abuse-detector.service';

@Injectable()
export class MessagesService {
  constructor(
    @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
    private conversationsService: ConversationsService,
    private abuseDetector: AbuseDetectorService,
  ) {}

  async create(
    conversationId: string,
    userId: string,
    role: 'user' | 'assistant' | 'system' | 'tool',
    content: string,
    metadata: Record<string, any> = {},
  ) {
    // Verify user owns conversation
    await this.conversationsService.findOneUserConversation(conversationId, userId);

    let sanitizedContent = content;
    if (role === 'user') {
      const scan = this.abuseDetector.detectPromptInjection(content);
      if (scan.isSuspicious) {
        metadata = { ...metadata, promptInjectionDetected: true, matchedPatterns: scan.matches };
      }
    }

    const message = new this.messageModel({
      conversationId,
      userId,
      role,
      content: sanitizedContent,
      metadata,
    });

    return message.save();
  }

  async findByConversation(
    conversationId: string,
    userId: string,
    query: { page?: number; limit?: number } = {},
  ) {
    await this.conversationsService.findOneUserConversation(conversationId, userId);

    const page = query.page || 1;
    const limit = query.limit || 100;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.messageModel
        .find({ conversationId, userId })
        .sort({ createdAt: 1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.messageModel.countDocuments({ conversationId, userId }),
    ]);

    return { items, total, page, limit };
  }
}
