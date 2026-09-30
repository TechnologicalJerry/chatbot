import { Controller, Post, Get, Body, Query, Sse, UseGuards } from '@nestjs/common';
import { Observable } from 'rxjs';
import { ChatService, MessageEvent } from './chat.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, UserPayload } from '../../common/decorators/current-user.decorator';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SendChatMessageDto {
  @IsString()
  @IsNotEmpty()
  conversationId!: string;

  @IsString()
  @IsNotEmpty()
  message!: string;

  @IsOptional()
  @IsString()
  model?: string;
}

@UseGuards(JwtAuthGuard)
@Controller('api/v1/chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  async sendChatMessage(
    @Body() dto: SendChatMessageDto,
    @CurrentUser() userPayload: UserPayload,
  ) {
    return this.chatService.processChatMessage(
      userPayload.userId,
      userPayload.tier || 'free',
      dto.conversationId,
      dto.message,
      dto.model,
    );
  }

  @Sse('stream')
  streamChat(
    @Query('conversationId') conversationId: string,
    @Query('message') message: string,
    @CurrentUser() userPayload: UserPayload,
  ): Observable<MessageEvent> {
    return this.chatService.streamChatMessage(
      userPayload.userId,
      userPayload.tier || 'free',
      conversationId,
      message,
    );
  }
}
