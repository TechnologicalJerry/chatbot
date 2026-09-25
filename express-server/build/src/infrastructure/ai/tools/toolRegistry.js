"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ToolRegistry = void 0;
var logger_1 = __importDefault(require("../../logger/logger"));
var ToolRegistry = /** @class */ (function () {
    function ToolRegistry() {
        this.tools = new Map();
    }
    ToolRegistry.getInstance = function () {
        if (!ToolRegistry.instance) {
            ToolRegistry.instance = new ToolRegistry();
        }
        return ToolRegistry.instance;
    };
    ToolRegistry.prototype.registerTool = function (tool) {
        if (this.tools.has(tool.name)) {
            logger_1.default.warn("Tool '".concat(tool.name, "' is already registered. Overwriting registration."));
        }
        this.tools.set(tool.name, tool);
        logger_1.default.info("Tool '".concat(tool.name, "' registered successfully"));
    };
    ToolRegistry.prototype.getTool = function (name) {
        return this.tools.get(name);
    };
    ToolRegistry.prototype.listTools = function () {
        return Array.from(this.tools.values());
    };
    /**
     * Convert registered tools into provider-independent ToolDefinition format.
     */
    ToolRegistry.prototype.getToolDefinitionsForAI = function () {
        var _this = this;
        return this.listTools().map(function (tool) { return ({
            name: tool.name,
            description: tool.description,
            parameters: _this.zodSchemaToParameters(tool.inputSchema),
        }); });
    };
    ToolRegistry.prototype.zodSchemaToParameters = function (schema) {
        // Basic Zod schema to JSON schema parameters converter
        try {
            if (schema && schema._def) {
                var shape = schema._def.shape ? schema._def.shape() : {};
                var properties = {};
                var required = [];
                for (var _i = 0, _a = Object.entries(shape); _i < _a.length; _i++) {
                    var _b = _a[_i], key = _b[0], value = _b[1];
                    properties[key] = { type: "string" };
                    required.push(key);
                }
                return {
                    type: "object",
                    properties: properties,
                    required: required,
                };
            }
        }
        catch (_c) {
            // Fallback
        }
        return { type: "object", properties: {} };
    };
    return ToolRegistry;
}());
exports.ToolRegistry = ToolRegistry;
exports.default = ToolRegistry;
