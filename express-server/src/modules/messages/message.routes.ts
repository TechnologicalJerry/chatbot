import { Router } from "express";
import { createMessageHandler, listMessagesHandler } from "./message.controller";
import requireUser from "../../middleware/auth/requireUser";
import validateResource from "../../middleware/validation/validateResource";
import { createMessageSchema } from "./message.schema";

const router = Router();

router.use(requireUser);

router.post("/:conversationId/messages", validateResource(createMessageSchema), createMessageHandler);
router.get("/:conversationId/messages", listMessagesHandler);

export default router;
