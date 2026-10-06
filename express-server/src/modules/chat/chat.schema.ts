import { object, string } from "zod";

export const postChatSchema = object({
  params: object({
    conversationId: string({ required_error: "conversationId is required" }),
  }),
  body: object({
    content: string({ required_error: "content is required" }),
  }),
});
