import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { MemoryService } from './memory.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, UserPayload } from '../../common/decorators/current-user.decorator';
import { IsNotEmpty, IsString } from 'class-validator';

export class AddMemoryDto {
  @IsString()
  @IsNotEmpty()
  fact!: string;
}

@UseGuards(JwtAuthGuard)
@Controller('api/v1/memory')
export class MemoryController {
  constructor(private readonly memoryService: MemoryService) {}

  @Post()
  async add(@Body() dto: AddMemoryDto, @CurrentUser() userPayload: UserPayload) {
    return this.memoryService.addMemory(userPayload.userId, dto.fact);
  }

  @Get()
  async getMemories(@CurrentUser() userPayload: UserPayload) {
    return this.memoryService.getUserMemories(userPayload.userId);
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @CurrentUser() userPayload: UserPayload) {
    return this.memoryService.deleteMemory(id, userPayload.userId);
  }
}
