import { object, string } from "zod";

export const createMessageSchema = object({
  params: object({
    conversationId: string({ required_error: "conversationId is required" }),
  }),
  body: object({
    content: string({ required_error: "content is required" }),
  }),
});
