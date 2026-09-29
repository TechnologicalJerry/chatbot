import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ToolRegistryService } from './tool-registry.service';
import { RagEngineService } from './rag-engine.service';
import { AiOrchestratorService } from './ai-orchestrator.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [ToolRegistryService, RagEngineService, AiOrchestratorService],
  exports: [ToolRegistryService, RagEngineService, AiOrchestratorService],
})
export class AiModule {}
