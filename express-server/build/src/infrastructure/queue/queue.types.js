"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JOB_NAMES = exports.QUEUE_NAMES = void 0;
exports.QUEUE_NAMES = {
    RAG_INGESTION: "rag-ingestion-queue",
    MEMORY_EXTRACTION: "memory-extraction-queue",
    CONVERSATION_SUMMARY: "conversation-summary-queue",
};
exports.JOB_NAMES = {
    PROCESS_RAG_DOCUMENT: "process-rag-document",
    EXTRACT_MEMORIES: "extract-memories",
    GENERATE_SUMMARY: "generate-summary",
};
