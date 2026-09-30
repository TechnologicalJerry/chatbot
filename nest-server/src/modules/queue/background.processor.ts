import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';

@Processor('chatbot-queue')
export class BackgroundProcessor extends WorkerHost {
  private readonly logger = new Logger(BackgroundProcessor.name);

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.log(`Processing async queue job: ${job.name} (id: ${job.id})`);

    switch (job.name) {
      case 'extract-memory':
        this.logger.log(`Extracting memory for user: ${job.data.userId}`);
        return { success: true, userId: job.data.userId };

      case 'generate-title':
        this.logger.log(`Generating title for conversation: ${job.data.conversationId}`);
        return { success: true, title: 'Auto Generated Title' };

      case 'index-vector':
        this.logger.log(`Indexing document vector: ${job.data.documentId}`);
        return { success: true, documentId: job.data.documentId };

      default:
        this.logger.warn(`Unknown job name: ${job.name}`);
        return { success: false };
    }
  }
}
