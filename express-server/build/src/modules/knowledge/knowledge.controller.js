"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteDocumentHandler = exports.listDocumentsHandler = exports.ingestDocumentHandler = void 0;
const knowledge_service_1 = require("./knowledge.service");
async function ingestDocumentHandler(req, res, next) {
    try {
        const ownerId = res.locals.user._id;
        const { title, content, sourceType } = req.body;
        const document = await knowledge_service_1.KnowledgeService.ingestDocument(ownerId, {
            title,
            content,
            sourceType,
        });
        return res.status(201).json({
            success: true,
            data: document,
        });
    }
    catch (err) {
        return next(err);
    }
}
exports.ingestDocumentHandler = ingestDocumentHandler;
async function listDocumentsHandler(req, res, next) {
    try {
        const ownerId = res.locals.user._id;
        const documents = await knowledge_service_1.KnowledgeService.getUserDocuments(ownerId);
        return res.status(200).json({
            success: true,
            data: documents,
        });
    }
    catch (err) {
        return next(err);
    }
}
exports.listDocumentsHandler = listDocumentsHandler;
async function deleteDocumentHandler(req, res, next) {
    try {
        const ownerId = res.locals.user._id;
        const { documentId } = req.params;
        await knowledge_service_1.KnowledgeService.deleteDocument(ownerId, documentId);
        return res.status(200).json({
            success: true,
            message: "Knowledge document deleted successfully",
        });
    }
    catch (err) {
        return next(err);
    }
}
exports.deleteDocumentHandler = deleteDocumentHandler;
