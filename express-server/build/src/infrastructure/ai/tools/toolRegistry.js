"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ToolRegistry = void 0;
const logger_1 = __importDefault(require("../../logger/logger"));
class ToolRegistry {
    static instance;
    tools = new Map();
    static getInstance() {
        if (!ToolRegistry.instance) {
            ToolRegistry.instance = new ToolRegistry();
        }
        return ToolRegistry.instance;
    }
    registerTool(tool) {
        if (this.tools.has(tool.name)) {
            logger_1.default.warn(`Tool '${tool.name}' is already registered. Overwriting registration.`);
        }
        this.tools.set(tool.name, tool);
        logger_1.default.info(`Tool '${tool.name}' registered successfully`);
    }
    getTool(name) {
        return this.tools.get(name);
    }
    listTools() {
        return Array.from(this.tools.values());
    }
    async executeTool(name, args, context) {
        const tool = this.getTool(name);
        if (!tool) {
            throw new Error(`Tool '${name}' is not registered`);
        }
        return tool.execute(args, context);
    }
    /**
     * Convert registered tools into provider-independent ToolDefinition format.
     */
    getToolDefinitionsForAI() {
        return this.listTools().map((tool) => ({
            name: tool.name,
            description: tool.description,
            parameters: this.zodSchemaToParameters(tool.inputSchema),
        }));
    }
    zodSchemaToParameters(schema) {
        try {
            if (schema && schema._def) {
                const shape = schema._def.shape ? schema._def.shape() : {};
                const properties = {};
                const required = [];
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
        }
        catch {
            // Fallback
        }
        return { type: "object", properties: {} };
    }
}
exports.ToolRegistry = ToolRegistry;
exports.default = ToolRegistry;
