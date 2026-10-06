import { Router } from "express";
import { createUserSessionHandler, getUserSessionsHandler, deleteSessionHandler } from "./session.controller";
import validateResource from "../../middleware/validation/validateResource";
import requireUser from "../../middleware/auth/requireUser";
import { createSessionSchema } from "./session.schema";
import { authRateLimiter } from "../../middleware/rateLimiter.middleware";

const router = Router();

router.post("/", authRateLimiter, validateResource(createSessionSchema), createUserSessionHandler);
router.get("/", requireUser, getUserSessionsHandler);
router.delete("/", requireUser, deleteSessionHandler);

export default router;
