import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { MessagesModule } from '../messages/messages.module';
import { MemoryModule } from '../memory/memory.module';
import { KnowledgeModule } from '../knowledge/knowledge.module';
import { ConversationsModule } from '../conversations/conversations.module';
import { AuthModule } from '../auth/auth.module';
import { SecurityModule } from '../../infrastructure/security/security.module';
import { AiModule } from '../../infrastructure/ai/ai.module';

@Module({
  imports: [
    MessagesModule,
    MemoryModule,
    KnowledgeModule,
    ConversationsModule,
    AuthModule,
    SecurityModule,
    AiModule,
  ],
  controllers: [ChatController],
  providers: [ChatService],
  exports: [ChatService],
})
export class ChatModule {}
