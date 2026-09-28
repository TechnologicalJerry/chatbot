import { z } from "zod";

export interface ToolExecutionContext {
  userId: string;
  conversationId?: string;
}

export interface ITool {
  name: string;
  description: string;
  inputSchema: z.ZodSchema;
  execute(args: any, context: ToolExecutionContext): Promise<any>;
}
