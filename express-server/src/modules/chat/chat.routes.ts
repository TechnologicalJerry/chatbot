import { Router } from "express";
import { postChatHandler, streamChatHandler } from "./chat.controller";
import requireUser from "../../middleware/auth/requireUser";
import validateResource from "../../middleware/validation/validateResource";
import { postChatSchema } from "./chat.schema";

const router = Router();

router.use(requireUser);

router.post("/:conversationId", validateResource(postChatSchema), postChatHandler);
router.post("/:conversationId/stream", validateResource(postChatSchema), streamChatHandler);
router.get("/:conversationId/stream", streamChatHandler);

export default router;
