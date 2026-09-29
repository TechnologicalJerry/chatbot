import { Controller, Post, Get, Body, Req, UseGuards, Delete, Param } from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { Public } from '../../common/decorators/public.decorator';
import { JwtAuthGuard } from './jwt-auth.guard';
import { CurrentUser, UserPayload } from '../../common/decorators/current-user.decorator';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;
}

@Controller('api/v1/sessions')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post()
  async login(@Body() dto: LoginDto, @Req() req: Request) {
    const userAgent = req.headers['user-agent'];
    const ipAddress = req.ip;
    return this.authService.login(dto.email, dto.password, userAgent, ipAddress);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async getSessions(@CurrentUser() userPayload: UserPayload) {
    return this.authService.getUserSessions(userPayload.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('current')
  async logoutCurrent(@CurrentUser() userPayload: UserPayload) {
    if (!userPayload.sessionId) {
      return { success: true };
    }
    return this.authService.logout(userPayload.sessionId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async deleteSession(@Param('id') id: string) {
    return this.authService.logout(id);
  }
}
