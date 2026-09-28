export const QUEUE_NAMES = {
  RAG_INGESTION: "rag-ingestion-queue",
  MEMORY_EXTRACTION: "memory-extraction-queue",
  CONVERSATION_SUMMARY: "conversation-summary-queue",
};

export const JOB_NAMES = {
  PROCESS_RAG_DOCUMENT: "process-rag-document",
  EXTRACT_MEMORIES: "extract-memories",
  GENERATE_SUMMARY: "generate-summary",
};

export interface RagIngestionJobData {
  documentId: string;
  title: string;
  content: string;
  ownerId: string;
  sourceType?: string;
  contentHash: string;
}

export interface MemoryExtractionJobData {
  userId: string;
  conversationId: string;
  userContent: string;
  assistantContent?: string;
}

export interface ConversationSummaryJobData {
  conversationId: string;
  userId: string;
}
