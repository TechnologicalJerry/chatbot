import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { KnowledgeService } from './knowledge.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, UserPayload } from '../../common/decorators/current-user.decorator';
import { IsNotEmpty, IsString } from 'class-validator';

export class UploadKnowledgeDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  content!: string;
}

@UseGuards(JwtAuthGuard)
@Controller('api/v1/knowledge')
export class KnowledgeController {
  constructor(private readonly knowledgeService: KnowledgeService) {}

  @Post()
  async upload(@Body() dto: UploadKnowledgeDto, @CurrentUser() userPayload: UserPayload) {
    return this.knowledgeService.uploadDocument(userPayload.userId, dto.title, dto.content);
  }

  @Get()
  async getDocuments(@CurrentUser() userPayload: UserPayload) {
    return this.knowledgeService.getUserDocuments(userPayload.userId);
  }

  @Get('search')
  async search(
    @Query('q') q: string,
    @CurrentUser() userPayload: UserPayload,
    @Query('limit') limit?: string,
  ) {
    return this.knowledgeService.searchSimilar(
      userPayload.userId,
      q || '',
      limit ? parseInt(limit, 10) : 3,
    );
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @CurrentUser() userPayload: UserPayload) {
    return this.knowledgeService.deleteDocument(id, userPayload.userId);
  }
}
