import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { BackgroundProcessor } from './background.processor';

@Global()
@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const redisUrl = configService.get<string>('redisUrl') || 'redis://127.0.0.1:6379';
        const url = new URL(redisUrl);
        return {
          connection: {
            host: url.hostname || '127.0.0.1',
            port: parseInt(url.port || '6379', 10),
          },
        };
      },
      inject: [ConfigService],
    }),
    BullModule.registerQueue({
      name: 'chatbot-queue',
    }),
  ],
  providers: [BackgroundProcessor],
  exports: [BullModule],
})
export class QueueModule {}
