import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ConversationsService } from './conversations.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, UserPayload } from '../../common/decorators/current-user.decorator';
import { IsOptional, IsString } from 'class-validator';

export class CreateConversationDto {
  @IsOptional()
  @IsString()
  title?: string;
}

export class UpdateConversationTitleDto {
  @IsString()
  title!: string;
}

@UseGuards(JwtAuthGuard)
@Controller('api/v1/conversations')
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Post()
  async create(@Body() dto: CreateConversationDto, @CurrentUser() userPayload: UserPayload) {
    return this.conversationsService.create(userPayload.userId, dto.title);
  }

  @Get()
  async findAll(
    @CurrentUser() userPayload: UserPayload,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.conversationsService.findUserConversations(userPayload.userId, {
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 50,
    });
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() userPayload: UserPayload) {
    return this.conversationsService.findOneUserConversation(id, userPayload.userId);
  }

  @Put(':id')
  async updateTitle(
    @Param('id') id: string,
    @Body() dto: UpdateConversationTitleDto,
    @CurrentUser() userPayload: UserPayload,
  ) {
    return this.conversationsService.updateTitle(id, userPayload.userId, dto.title);
  }

  @Put(':id/archive')
  async archive(@Param('id') id: string, @CurrentUser() userPayload: UserPayload) {
    return this.conversationsService.archive(id, userPayload.userId);
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @CurrentUser() userPayload: UserPayload) {
    return this.conversationsService.delete(id, userPayload.userId);
  }
}
