import { Injectable, ForbiddenException, HttpException, HttpStatus } from '@nestjs/common';
import { Observable, Subject } from 'rxjs';
import { AiOrchestratorService, ChatMessage } from '../../infrastructure/ai/ai-orchestrator.service';
import { MessagesService } from '../messages/messages.service';
import { MemoryService } from '../memory/memory.service';
import { KnowledgeService } from '../knowledge/knowledge.service';
import { ConversationsService } from '../conversations/conversations.service';
import { QuotaService } from '../../infrastructure/security/quota.service';
import { RateLimiterService } from '../../infrastructure/security/rate-limiter.service';
import { AbuseDetectorService } from '../../infrastructure/security/abuse-detector.service';

export interface MessageEvent {
  data: string | object;
  id?: string;
  type?: string;
  retry?: number;
}

@Injectable()
export class ChatService {
  constructor(
    private aiOrchestrator: AiOrchestratorService,
    private messagesService: MessagesService,
    private memoryService: MemoryService,
    private knowledgeService: KnowledgeService,
    private conversationsService: ConversationsService,
    private quotaService: QuotaService,
    private rateLimiter: RateLimiterService,
    private abuseDetector: AbuseDetectorService,
  ) {}

  async processChatMessage(
    userId: string,
    tier: string,
    conversationId: string,
    userMessageContent: string,
    model?: string,
  ) {
    // 1. Rate Limit & Quota Check
    const rateCheck = await this.rateLimiter.checkRateLimit(`chat:${userId}`, 30, 60);
    if (!rateCheck.allowed) {
      throw new HttpException('Rate limit exceeded. Please wait a minute.', HttpStatus.TOO_MANY_REQUESTS);
    }

    const quotaCheck = await this.quotaService.checkQuota(userId, tier, 500);
    if (!quotaCheck.allowed) {
      throw new ForbiddenException(quotaCheck.reason || 'Quota exceeded');
    }

    // 2. Ensure conversation exists & belongs to user
    await this.conversationsService.findOneUserConversation(conversationId, userId);

    // 3. Fetch past messages for context
    const history = await this.messagesService.findByConversation(conversationId, userId, { limit: 20 });
    const formattedHistory: ChatMessage[] = history.items.map((msg) => ({
      role: msg.role as any,
      content: msg.content,
    }));

    // 4. Fetch RAG Context and Memories in parallel
    const [memories, ragChunks] = await Promise.all([
      this.memoryService.getUserMemories(userId),
      this.knowledgeService.searchSimilar(userId, userMessageContent, 3),
    ]);

    const memoryStrings = memories.map((m) => m.fact);
    const ragContexts = ragChunks.map((c) => c.content);

    // 5. Save user message to database
    const sanitizedInput = this.abuseDetector.sanitizeInput(userMessageContent);
    await this.messagesService.create(conversationId, userId, 'user', userMessageContent);

    // 6. Run AI Orchestrator
    const inputMessages: ChatMessage[] = [
      ...formattedHistory,
      { role: 'user', content: sanitizedInput },
    ];

    const result = await this.aiOrchestrator.processChat(inputMessages, {
      userId,
      model,
      memories: memoryStrings,
      ragContexts,
    });

    // 7. Save assistant response to database
    await this.messagesService.create(conversationId, userId, 'assistant', result.text);

    // 8. Record token usage and trigger memory extraction asynchronously
    await this.quotaService.recordUsage(userId, result.tokensUsed);
    this.memoryService.extractMemoriesFromText(userId, userMessageContent).catch(() => {});

    return {
      conversationId,
      role: 'assistant',
      content: result.text,
      tokensUsed: result.tokensUsed,
    };
  }

  streamChatMessage(
    userId: string,
    tier: string,
    conversationId: string,
    userMessageContent: string,
  ): Observable<MessageEvent> {
    const subject = new Subject<MessageEvent>();

    // Process asynchronously and push chunks to SSE subject
    (async () => {
      try {
        const response = await this.processChatMessage(userId, tier, conversationId, userMessageContent);
        const fullText = response.content;

        // Stream word by word for smooth client UX
        const words = fullText.split(' ');
        for (let i = 0; i < words.length; i++) {
          const chunk = (i === 0 ? '' : ' ') + words[i];
          subject.next({
            type: 'chunk',
            data: JSON.stringify({ content: chunk }),
          });
          await new Promise((resolve) => setTimeout(resolve, 30));
        }

        subject.next({
          type: 'done',
          data: JSON.stringify({ conversationId, fullText, tokensUsed: response.tokensUsed }),
        });
        subject.complete();
      } catch (err: any) {
        subject.error(err);
      }
    })();

    return subject.asObservable();
  }
}
