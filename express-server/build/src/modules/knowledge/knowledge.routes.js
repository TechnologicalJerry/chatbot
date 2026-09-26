"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var knowledge_controller_1 = require("./knowledge.controller");
var requireUser_1 = __importDefault(require("../../middleware/auth/requireUser"));
var validateResource_1 = __importDefault(require("../../middleware/validation/validateResource"));
var knowledge_schema_1 = require("./knowledge.schema");
var router = (0, express_1.Router)();
// All knowledge endpoints require authentication
router.use(requireUser_1.default);
/**
 * @openapi
 * /api/v1/knowledge/documents:
 *   post:
 *     tags:
 *     - Knowledge
 *     summary: Ingest a text document into the knowledge base for RAG
 *     security:
 *     - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - content
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               sourceType:
 *                 type: string
 *                 enum: [text, markdown, file]
 *     responses:
 *       201:
 *         description: Document ingested successfully
 *       400:
 *         description: Validation or duplicate content error
 *       403:
 *         description: Unauthorized
 *   get:
 *     tags:
 *     - Knowledge
 *     summary: List authenticated user's knowledge documents
 *     security:
 *     - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of documents
 *       403:
 *         description: Unauthorized
 */
var rateLimiter_middleware_1 = require("../../middleware/rateLimiter.middleware");
router.post("/", rateLimiter_middleware_1.ingestionRateLimiter, (0, validateResource_1.default)(knowledge_schema_1.ingestDocumentSchema), knowledge_controller_1.ingestDocumentHandler);
router.get("/", knowledge_controller_1.listDocumentsHandler);
/**
 * @openapi
 * /api/v1/knowledge/documents/{documentId}:
 *   delete:
 *     tags:
 *     - Knowledge
 *     summary: Delete a knowledge document and remove vector chunks
 *     security:
 *     - bearerAuth: []
 *     parameters:
 *     - name: documentId
 *       in: path
 *       required: true
 *       schema:
 *         type: string
 *     responses:
 *       200:
 *         description: Document deleted successfully
 *       403:
 *         description: Unauthorized
 *       404:
 *         description: Document not found
 */
router.delete("/:documentId", (0, validateResource_1.default)(knowledge_schema_1.deleteDocumentSchema), knowledge_controller_1.deleteDocumentHandler);
exports.default = router;
