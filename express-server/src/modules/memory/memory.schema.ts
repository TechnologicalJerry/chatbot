import { object, string, enum as zenum, number } from "zod";

export const createMemorySchema = object({
  body: object({
    type: zenum(["preference", "fact", "goal", "profile"]),
    key: string({ required_error: "key is required" }),
    value: string({ required_error: "value is required" }),
    conversationId: string().optional(),
    confidence: number().optional(),
  }),
});

export const deleteMemorySchema = object({
  params: object({
    memoryId: string({ required_error: "memoryId is required" }),
  }),
});
