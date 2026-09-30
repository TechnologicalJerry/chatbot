import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { KnowledgeDocumentClass, KnowledgeDocumentSchema } from './knowledge-doc.schema';
import { KnowledgeChunk, KnowledgeChunkSchema } from './knowledge-chunk.schema';
import { KnowledgeService } from './knowledge.service';
import { KnowledgeController } from './knowledge.controller';
import { AuthModule } from '../auth/auth.module';
import { AiModule } from '../../infrastructure/ai/ai.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: KnowledgeDocumentClass.name, schema: KnowledgeDocumentSchema },
      { name: KnowledgeChunk.name, schema: KnowledgeChunkSchema },
    ]),
    AuthModule,
    AiModule,
  ],
  controllers: [KnowledgeController],
  providers: [KnowledgeService],
  exports: [KnowledgeService],
})
export class KnowledgeModule {}
