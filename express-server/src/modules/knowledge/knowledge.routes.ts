import { Router } from "express";
import {
  ingestDocumentHandler,
  listDocumentsHandler,
  deleteDocumentHandler,
} from "./knowledge.controller";
import requireUser from "../../middleware/auth/requireUser";
import validateResource from "../../middleware/validation/validateResource";
import { ingestDocumentSchema, deleteDocumentSchema } from "./knowledge.schema";

const router = Router();

// All knowledge endpoints require authentication
router.use(requireUser);

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
import { ingestionRateLimiter } from "../../middleware/rateLimiter.middleware";

router.post("/", ingestionRateLimiter, validateResource(ingestDocumentSchema), ingestDocumentHandler);
router.get("/", listDocumentsHandler);

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
router.delete("/:documentId", validateResource(deleteDocumentSchema), deleteDocumentHandler);

export default router;
