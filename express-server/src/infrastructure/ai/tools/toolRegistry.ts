import { ITool } from "./tool.interface";
import { ToolDefinition } from "../types";
import logger from "../../logger/logger";

export class ToolRegistry {
  private static instance: ToolRegistry;
  private tools = new Map<string, ITool>();

  public static getInstance(): ToolRegistry {
    if (!ToolRegistry.instance) {
      ToolRegistry.instance = new ToolRegistry();
    }
    return ToolRegistry.instance;
  }

  public registerTool(tool: ITool): void {
    if (this.tools.has(tool.name)) {
      logger.warn(`Tool '${tool.name}' is already registered. Overwriting registration.`);
    }
    this.tools.set(tool.name, tool);
    logger.info(`Tool '${tool.name}' registered successfully`);
  }

  public getTool(name: string): ITool | undefined {
    return this.tools.get(name);
  }

  public listTools(): ITool[] {
    return Array.from(this.tools.values());
  }

  public async executeTool(name: string, args: any, context?: any): Promise<any> {
    const tool = this.getTool(name);
    if (!tool) {
      throw new Error(`Tool '${name}' is not registered`);
    }
    return tool.execute(args, context);
  }

  /**
   * Convert registered tools into provider-independent ToolDefinition format.
   */
  public getToolDefinitionsForAI(): ToolDefinition[] {
    return this.listTools().map((tool) => ({
      name: tool.name,
      description: tool.description,
      parameters: this.zodSchemaToParameters(tool.inputSchema),
    }));
  }

  private zodSchemaToParameters(schema: any): Record<string, unknown> {
    try {
      if (schema && schema._def) {
        const shape = schema._def.shape ? schema._def.shape() : {};
        const properties: Record<string, unknown> = {};
        const required: string[] = [];

        for (const [key] of Object.entries(shape)) {
          properties[key] = { type: "string" };
          required.push(key);
        }

        return {
          type: "object",
          properties,
          required,
        };
      }
    } catch {
      // Fallback
    }
    return { type: "object", properties: {} };
  }
}

export default ToolRegistry;
