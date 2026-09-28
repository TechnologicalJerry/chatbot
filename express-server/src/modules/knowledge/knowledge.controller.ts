import { Request, Response, NextFunction } from "express";
import { KnowledgeService } from "./knowledge.service";

export async function ingestDocumentHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const ownerId = res.locals.user._id;
    const { title, content, sourceType } = req.body;

    const document = await KnowledgeService.ingestDocument(ownerId, {
      title,
      content,
      sourceType,
    });

    return res.status(201).json({
      success: true,
      data: document,
    });
  } catch (err) {
    return next(err);
  }
}

export async function listDocumentsHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const ownerId = res.locals.user._id;
    const documents = await KnowledgeService.getUserDocuments(ownerId);

    return res.status(200).json({
      success: true,
      data: documents,
    });
  } catch (err) {
    return next(err);
  }
}

export async function deleteDocumentHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const ownerId = res.locals.user._id;
    const { documentId } = req.params;

    await KnowledgeService.deleteDocument(ownerId, documentId);

    return res.status(200).json({
      success: true,
      message: "Knowledge document deleted successfully",
    });
  } catch (err) {
    return next(err);
  }
}
