import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import { IS_PUBLIC_KEY } from '../../common/decorators/public.decorator';
import { RedisService } from '../../infrastructure/redis/redis.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private configService: ConfigService,
    private redisService: RedisService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid Authorization header');
    }

    const token = authHeader.split(' ')[1];
    const secret = this.configService.get<string>('jwt.secret') || 'default-secret';

    try {
      const decoded = jwt.verify(token, secret) as any;

      if (decoded.sessionId) {
        const isBlacklisted = await this.redisService.get(`session:blacklisted:${decoded.sessionId}`);
        if (isBlacklisted) {
          throw new UnauthorizedException('Session has been revoked');
        }
      }

      request.user = {
        userId: decoded.userId || decoded.sub || decoded.id,
        email: decoded.email,
        role: decoded.role || 'user',
        tier: decoded.tier || 'free',
        sessionId: decoded.sessionId,
      };

      return true;
    } catch (err: any) {
      throw new UnauthorizedException(err.message || 'Invalid authentication token');
    }
  }
}
