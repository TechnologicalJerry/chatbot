import { object, string, enum as zenum, any } from "zod";

export const createConversationSchema = object({
  body: object({
    title: string().optional(),
    metadata: any().optional(),
  }),
});

export const updateConversationSchema = object({
  params: object({
    conversationId: string({ required_error: "conversationId is required" }),
  }),
  body: object({
    title: string().optional(),
    status: zenum(["active", "archived", "deleted"]).optional(),
  }),
});

export const getConversationSchema = object({
  params: object({
    conversationId: string({ required_error: "conversationId is required" }),
  }),
});

export const deleteConversationSchema = object({
  params: object({
    conversationId: string({ required_error: "conversationId is required" }),
  }),
});
