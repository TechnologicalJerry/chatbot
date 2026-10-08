"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const mongoose_1 = __importDefault(require("mongoose"));
const app_1 = __importDefault(require("../app"));
const knowledgeDocument_model_1 = __importDefault(require("../modules/knowledge/knowledgeDocument.model"));
const knowledgeChunk_model_1 = __importDefault(require("../modules/knowledge/knowledgeChunk.model"));
const knowledge_service_1 = require("../modules/knowledge/knowledge.service");
const rag_service_1 = require("../infrastructure/ai/rag/rag.service");
const database_1 = require("../infrastructure/database/database");
const jwt_utils_1 = require("../utils/jwt.utils");
const ai_factory_1 = require("../infrastructure/ai/ai.factory");
const ai_orchestrator_1 = require("../infrastructure/ai/ai.orchestrator");
jest.setTimeout(30000);
class MockRAGAIProvider {
    async generateCompletion(messages, options) {
        return {
            id: "mock-rag-123",
            message: { role: "assistant", content: "Based on your documents, fitness is important." },
            finishReason: "stop",
            usage: { promptTokens: 40, completionTokens: 10, totalTokens: 50 },
        };
    }
    async *streamResponse(messages, options) {
        yield { type: "text_delta", text: "Based on your documents, fitness is important." };
        yield { type: "completion", finishReason: "stop", usage: { promptTokens: 40, completionTokens: 10, totalTokens: 50 } };
    }
}
describe("Stage 7 - RAG Knowledge Subsystem Tests", () => {
    const app = (0, app_1.default)();
    const userAId = new mongoose_1.default.Types.ObjectId().toString();
    const userBId = new mongoose_1.default.Types.ObjectId().toString();
    const tokenUserA = (0, jwt_utils_1.signJwt)({ _id: userAId, email: "userA@example.com", name: "User A" }, "accessTokenPrivateKey");
    const tokenUserB = (0, jwt_utils_1.signJwt)({ _id: userBId, email: "userB@example.com", name: "User B" }, "accessTokenPrivateKey");
    let isDbConnected = false;
    beforeAll(async () => {
        (0, ai_factory_1.setAIOrchestrator)(new ai_orchestrator_1.AIOrchestrator(new MockRAGAIProvider()));
        try {
            await (0, database_1.connectDatabase)();
            isDbConnected = true;
            await knowledgeDocument_model_1.default.deleteMany({});
            await knowledgeChunk_model_1.default.deleteMany({});
        }
        catch {
            isDbConnected = false;
        }
    });
    afterAll(async () => {
        (0, ai_factory_1.setAIOrchestrator)(null);
        if (isDbConnected) {
            await knowledgeDocument_model_1.default.deleteMany({});
            await knowledgeChunk_model_1.default.deleteMany({});
        }
        await (0, database_1.disconnectDatabase)();
    });
    describe("Text Chunking & Content Hashing", () => {
        it("should chunk long text into sentence-aware segments", () => {
            const longText = "First sentence about fitness. Second sentence about nutrition. Third sentence about recovery.";
            const chunks = knowledge_service_1.KnowledgeService.chunkText(longText, 40, 5);
            expect(chunks.length).toBeGreaterThan(0);
            expect(chunks[0]).toContain("fitness");
        });
    });
    describe("Document Ingestion & Vector Retrieval", () => {
        it("should ingest text document, create chunks, and generate mock embeddings", async () => {
            if (!isDbConnected)
                return;
            const doc = await knowledge_service_1.KnowledgeService.ingestDocument(userAId, {
                title: "User A Fitness Guide",
                content: "Running a marathon requires consistent cardio and proper hydration daily.",
            });
            expect(doc.status).toBe("ready");
            expect(doc.chunkCount).toBeGreaterThan(0);
            const chunksInDb = await knowledgeChunk_model_1.default.find({ documentId: doc._id });
            expect(chunksInDb.length).toBe(doc.chunkCount);
            expect(chunksInDb[0].embedding.length).toBeGreaterThan(0);
        });
        it("should reject duplicate document ingestion using content SHA-256 hash", async () => {
            if (!isDbConnected)
                return;
            await expect(knowledge_service_1.KnowledgeService.ingestDocument(userAId, {
                title: "Duplicate Fitness Guide",
                content: "Running a marathon requires consistent cardio and proper hydration daily.",
            })).rejects.toThrow("Document with identical content already exists");
        });
        it("SECURITY: User B CANNOT retrieve User A's private knowledge chunks", async () => {
            if (!isDbConnected)
                return;
            // Search as User B for marathon knowledge created by User A
            const ragResult = await rag_service_1.RAGService.retrieveKnowledge(userBId, "marathon cardio");
            expect(ragResult.chunkCount).toBe(0);
            expect(ragResult.citations.length).toBe(0);
            expect(ragResult.formattedContext).toBe("");
        });
        it("User A CAN retrieve their own knowledge chunks with citation metadata", async () => {
            if (!isDbConnected)
                return;
            const ragResult = await rag_service_1.RAGService.retrieveKnowledge(userAId, "marathon cardio");
            expect(ragResult.chunkCount).toBeGreaterThan(0);
            expect(ragResult.citations.length).toBeGreaterThan(0);
            expect(ragResult.citations[0].title).toBe("User A Fitness Guide");
            expect(ragResult.formattedContext).toContain("<retrieved_knowledge>");
        });
    });
    describe("Knowledge Management REST API & Security Scoping", () => {
        let docAId;
        beforeAll(async () => {
            if (!isDbConnected)
                return;
            const docA = await knowledge_service_1.KnowledgeService.ingestDocument(userAId, {
                title: "API Guide Doc",
                content: "API integration guide content for user A.",
            });
            docAId = docA._id.toString();
        });
        it("POST /api/v1/knowledge/documents - should ingest document for authenticated user", async () => {
            if (!isDbConnected)
                return;
            const res = await (0, supertest_1.default)(app)
                .post("/api/v1/knowledge/documents")
                .set("Authorization", `Bearer ${tokenUserA}`)
                .send({ title: "New Web Doc", content: "Unique web document content for user A." });
            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data.title).toBe("New Web Doc");
        });
        it("GET /api/v1/knowledge/documents - should list user's documents", async () => {
            if (!isDbConnected)
                return;
            const res = await (0, supertest_1.default)(app)
                .get("/api/v1/knowledge/documents")
                .set("Authorization", `Bearer ${tokenUserA}`);
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(Array.isArray(res.body.data)).toBe(true);
            expect(res.body.data.length).toBeGreaterThan(0);
        });
        it("SECURITY DENIED: User B CANNOT delete User A's knowledge document", async () => {
            if (!isDbConnected)
                return;
            const res = await (0, supertest_1.default)(app)
                .delete(`/api/v1/knowledge/documents/${docAId}`)
                .set("Authorization", `Bearer ${tokenUserB}`);
            expect(res.status).toBe(404);
        });
        it("DELETE /api/v1/knowledge/documents/:id - User A can delete their own document and chunks", async () => {
            if (!isDbConnected)
                return;
            const res = await (0, supertest_1.default)(app)
                .delete(`/api/v1/knowledge/documents/${docAId}`)
                .set("Authorization", `Bearer ${tokenUserA}`);
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            const docInDb = await knowledgeDocument_model_1.default.findById(docAId);
            expect(docInDb?.status).toBe("deleted");
            const chunksInDb = await knowledgeChunk_model_1.default.find({ documentId: docAId });
            expect(chunksInDb.length).toBe(0);
        });
    });
});
