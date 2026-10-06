import { Request, Response, NextFunction } from "express";
import { nanoid } from "nanoid";
import { HEADER_REQUEST_ID } from "../../config/constants";

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction) {
  const existingId = req.headers[HEADER_REQUEST_ID] as string;
  const requestId = existingId || `req_${nanoid(12)}`;
  req.headers[HEADER_REQUEST_ID] = requestId;
  res.setHeader(HEADER_REQUEST_ID, requestId);
  (req as any).id = requestId;
  next();
}

export default requestIdMiddleware;
