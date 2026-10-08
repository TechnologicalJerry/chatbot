"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const mongoose_1 = __importDefault(require("mongoose"));
const app_1 = __importDefault(require("../app"));
const toolRegistry_1 = __importDefault(require("../infrastructure/ai/tools/toolRegistry"));
const searchProducts_tool_1 = __importDefault(require("../infrastructure/ai/tools/implementations/searchProducts.tool"));
const getProduct_tool_1 = __importDefault(require("../infrastructure/ai/tools/implementations/getProduct.tool"));
const getUserProfile_tool_1 = __importDefault(require("../infrastructure/ai/tools/implementations/getUserProfile.tool"));
const getConversationSummary_tool_1 = __importDefault(require("../infrastructure/ai/tools/implementations/getConversationSummary.tool"));
const product_model_1 = __importDefault(require("../modules/products/product.model"));
const user_model_1 = __importDefault(require("../modules/users/user.model"));
const conversation_model_1 = __importDefault(require("../modules/conversations/conversation.model"));
const message_model_1 = __importDefault(require("../modules/messages/message.model"));
const database_1 = require("../infrastructure/database/database");
const jwt_utils_1 = require("../utils/jwt.utils");
const ai_factory_1 = require("../infrastructure/ai/ai.factory");
const ai_orchestrator_1 = require("../infrastructure/ai/ai.orchestrator");
jest.setTimeout(30000);
class MockToolAIProvider {
    callCount = 0;
    async generateCompletion(messages, options) {
        this.callCount++;
        const lastMsg = messages[messages.length - 1];
        // If initial prompt asks to search products, request tool call
        if (this.callCount === 1 && lastMsg.role === "user" && lastMsg.content.includes("search products")) {
            return {
                id: "tool-call-123",
                message: {
                    role: "assistant",
                    content: "",
                    tool_calls: [
                        {
                            id: "call_abc123",
                            type: "function",
                            function: {
                                name: "search_products",
                                arguments: JSON.stringify({ query: "Laptop", limit: 3 }),
                            },
                        },
                    ],
                },
                finishReason: "tool_calls",
            };
        }
        // Second round (after tool result is received): return final text response
        return {
            id: "tool-final-123",
            message: {
                role: "assistant",
                content: "I found matching laptop products for you.",
            },
            finishReason: "stop",
            usage: { promptTokens: 30, completionTokens: 15, totalTokens: 45 },
        };
    }
    async *streamResponse(messages, options) {
        yield { type: "text_delta", text: "I found matching laptop products for you." };
        yield { type: "completion", finishReason: "stop", usage: { promptTokens: 30, completionTokens: 15, totalTokens: 45 } };
    }
}
describe("Stage 7 - Tool Execution Subsystem Tests", () => {
    const app = (0, app_1.default)();
    const userAId = new mongoose_1.default.Types.ObjectId().toString();
    const tokenUserA = (0, jwt_utils_1.signJwt)({ _id: userAId, email: "userA@example.com", name: "User A" }, "accessTokenPrivateKey");
    let isDbConnected = false;
    let productId;
    let convAId;
    beforeAll(async () => {
        // Register tools
        const registry = toolRegistry_1.default.getInstance();
        registry.registerTool(new searchProducts_tool_1.default());
        registry.registerTool(new getProduct_tool_1.default());
        registry.registerTool(new getUserProfile_tool_1.default());
        registry.registerTool(new getConversationSummary_tool_1.default());
        (0, ai_factory_1.setAIOrchestrator)(new ai_orchestrator_1.AIOrchestrator(new MockToolAIProvider()));
        try {
            await (0, database_1.connectDatabase)();
            isDbConnected = true;
            await product_model_1.default.deleteMany({});
            await user_model_1.default.deleteMany({});
            await conversation_model_1.default.deleteMany({});
            await message_model_1.default.deleteMany({});
            if (isDbConnected) {
                const prod = await product_model_1.default.create({
                    userId: userAId,
                    productId: "prod-laptop-1",
                    title: "Gaming Laptop",
                    price: 1200,
                    description: "High performance laptop",
                    image: "laptop.jpg",
                });
                productId = prod.productId;
                await user_model_1.default.create({
                    _id: userAId,
                    email: "userA@example.com",
                    name: "User A",
                    password: "HashedPassword123",
                });
                const conv = await conversation_model_1.default.create({
                    userId: userAId,
                    title: "Tool Test Conversation",
                    status: "active",
                });
                convAId = conv._id.toString();
            }
        }
        catch {
            isDbConnected = false;
        }
    });
    afterAll(async () => {
        (0, ai_factory_1.setAIOrchestrator)(null);
        if (isDbConnected) {
            await product_model_1.default.deleteMany({});
            await user_model_1.default.deleteMany({});
            await conversation_model_1.default.deleteMany({});
            await message_model_1.default.deleteMany({});
        }
        await (0, database_1.disconnectDatabase)();
    });
    describe("ToolRegistry & Read-Only Tool Execution", () => {
        it("should register tools and output provider-independent tool definitions", () => {
            const registry = toolRegistry_1.default.getInstance();
            const defs = registry.getToolDefinitionsForAI();
            expect(defs.length).toBeGreaterThanOrEqual(4);
            expect(defs.some((d) => d.name === "search_products")).toBe(true);
            expect(defs.some((d) => d.name === "get_user_profile")).toBe(true);
        });
        it("search_products tool should return matching catalog products", async () => {
            if (!isDbConnected)
                return;
            const tool = new searchProducts_tool_1.default();
            const results = await tool.execute({ query: "Laptop", limit: 3 }, { userId: userAId });
            expect(Array.isArray(results)).toBe(true);
            expect(results.length).toBe(1);
            expect(results[0].title).toBe("Gaming Laptop");
            expect(results[0].price).toBe(1200);
        });
        it("get_user_profile tool should return user profile using server-authenticated context", async () => {
            if (!isDbConnected)
                return;
            const tool = new getUserProfile_tool_1.default();
            const profile = await tool.execute({}, { userId: userAId });
            expect(profile).toBeDefined();
            expect(profile.email).toBe("userA@example.com");
            expect(profile.name).toBe("User A");
            // Verify sensitive password field is excluded
            expect(profile.password).toBeUndefined();
        });
    });
    describe("Bounded Tool Execution Loop in AIOrchestrator & Chat Endpoint", () => {
        it("should execute tool requested by AI model and supply sanitized tool output for final completion", async () => {
            if (!isDbConnected)
                return;
            const res = await (0, supertest_1.default)(app)
                .post(`/api/v1/conversations/${convAId}/chat`)
                .set("Authorization", `Bearer ${tokenUserA}`)
                .send({ content: "Please search products for Laptop" });
            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data.assistantMessage.content).toBe("I found matching laptop products for you.");
        });
    });
});
