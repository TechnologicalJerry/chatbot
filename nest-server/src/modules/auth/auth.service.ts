import { Injectable, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { UsersService } from '../users/users.service';
import { Session, SessionDocument } from './session.schema';
import { RedisService } from '../../infrastructure/redis/redis.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    @InjectModel(Session.name) private sessionModel: Model<SessionDocument>,
    private configService: ConfigService,
    private redisService: RedisService,
  ) {}

  async validateUser(email: string, pass: string) {
    const user = await this.usersService.findByEmail(email, true);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(pass, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return this.usersService.sanitize(user);
  }

  async login(email: string, pass: string, userAgent?: string, ipAddress?: string) {
    const user = await this.validateUser(email, pass);

    const session = new this.sessionModel({
      user: user._id,
      valid: true,
      userAgent,
      ipAddress,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });
    await session.save();

    const payload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      tier: user.tier,
      sessionId: session._id.toString(),
    };

    const secret = this.configService.get<string>('jwt.secret') || 'default-secret';
    const expiresIn = this.configService.get<string>('jwt.expiresIn') || '1d';

    const accessToken = jwt.sign(payload, secret, { expiresIn: expiresIn as any });
    const refreshToken = jwt.sign({ ...payload, isRefresh: true }, secret, { expiresIn: '7d' });

    return {
      user,
      accessToken,
      refreshToken,
      sessionId: session._id.toString(),
    };
  }

  async logout(sessionId: string) {
    await this.sessionModel.findByIdAndUpdate(sessionId, { valid: false });
    await this.redisService.set(`session:blacklisted:${sessionId}`, 'true', 7 * 24 * 3600);
    return { success: true, message: 'Logged out successfully' };
  }

  async getUserSessions(userId: string) {
    return this.sessionModel.find({ user: userId, valid: true }).sort({ createdAt: -1 }).exec();
  }
}
