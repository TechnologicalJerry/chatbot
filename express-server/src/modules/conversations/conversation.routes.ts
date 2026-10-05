import { Router } from "express";
import {
  createConversationHandler,
  deleteConversationHandler,
  getConversationHandler,
  listConversationsHandler,
  updateConversationHandler,
} from "./conversation.controller";
import requireUser from "../../middleware/auth/requireUser";
import validateResource from "../../middleware/validation/validateResource";
import {
  createConversationSchema,
  deleteConversationSchema,
  getConversationSchema,
  updateConversationSchema,
} from "./conversation.schema";
import { createMessageHandler, listMessagesHandler } from "../messages/message.controller";
import { postChatHandler, streamChatHandler } from "../chat/chat.controller";

const router = Router();

router.use(requireUser);

router.post("/", validateResource(createConversationSchema), createConversationHandler);
router.get("/", listConversationsHandler);
router.get("/:conversationId", validateResource(getConversationSchema), getConversationHandler);
router.put("/:conversationId", validateResource(updateConversationSchema), updateConversationHandler);
router.delete("/:conversationId", validateResource(deleteConversationSchema), deleteConversationHandler);

// Sub-routes for conversation messages and AI chat
router.get("/:conversationId/messages", listMessagesHandler);
router.post("/:conversationId/messages", createMessageHandler);
router.post("/:conversationId/chat", postChatHandler);
router.post("/:conversationId/chat/stream", streamChatHandler);
router.get("/:conversationId/chat/stream", streamChatHandler);

export default router;
