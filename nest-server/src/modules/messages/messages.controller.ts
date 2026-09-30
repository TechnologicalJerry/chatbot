import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, UserPayload } from '../../common/decorators/current-user.decorator';
import { IsNotEmpty, IsString, IsEnum, IsOptional } from 'class-validator';

export class CreateMessageDto {
  @IsEnum(['user', 'assistant', 'system', 'tool'])
  role!: 'user' | 'assistant' | 'system' | 'tool';

  @IsString()
  @IsNotEmpty()
  content!: string;

  @IsOptional()
  metadata?: Record<string, any>;
}

@UseGuards(JwtAuthGuard)
@Controller('api/v1/conversations/:conversationId/messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post()
  async create(
    @Param('conversationId') conversationId: string,
    @Body() dto: CreateMessageDto,
    @CurrentUser() userPayload: UserPayload,
  ) {
    return this.messagesService.create(
      conversationId,
      userPayload.userId,
      dto.role,
      dto.content,
      dto.metadata,
    );
  }

  @Get()
  async findAll(
    @Param('conversationId') conversationId: string,
    @CurrentUser() userPayload: UserPayload,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.messagesService.findByConversation(conversationId, userPayload.userId, {
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 100,
    });
  }
}
