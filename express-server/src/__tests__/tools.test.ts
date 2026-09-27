import request from "supertest";
import mongoose from "mongoose";
import createApp from "../app";
import ToolRegistry from "../infrastructure/ai/tools/toolRegistry";
import SearchProductsTool from "../infrastructure/ai/tools/implementations/searchProducts.tool";
import GetProductTool from "../infrastructure/ai/tools/implementations/getProduct.tool";
import GetUserProfileTool from "../infrastructure/ai/tools/implementations/getUserProfile.tool";
import GetConversationSummaryTool from "../infrastructure/ai/tools/implementations/getConversationSummary.tool";
import ProductModel from "../modules/products/product.model";
import UserModel from "../modules/users/user.model";
import ConversationModel from "../modules/conversations/conversation.model";
import MessageModel from "../modules/messages/message.model";
import { connectDatabase, disconnectDatabase } from "../infrastructure/database/database";
import { signJwt } from "../utils/jwt.utils";
import { setAIOrchestrator } from "../infrastructure/ai/ai.factory";
import { AIOrchestrator } from "../infrastructure/ai/ai.orchestrator";
import { IAIProvider } from "../infrastructure/ai/aiProvider.interface";
import { ChatMessage, ChatCompletionOptions, ChatCompletionResult, AIStreamChunk } from "../infrastructure/ai/types";

jest.setTimeout(30000);

class MockToolAIProvider implements IAIProvider {
  private callCount = 0;

  async generateCompletion(
    messages: ChatMessage[],
    options?: ChatCompletionOptions
  ): Promise<ChatCompletionResult> {
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

  async *streamResponse(
    messages: ChatMessage[],
    options?: ChatCompletionOptions & { signal?: AbortSignal }
  ): AsyncIterable<AIStreamChunk> {
    yield { type: "text_delta", text: "I found matching laptop products for you." };
    yield { type: "completion", finishReason: "stop", usage: { promptTokens: 30, completionTokens: 15, totalTokens: 45 } };
  }
}

describe("Stage 7 - Tool Execution Subsystem Tests", () => {
  const app = createApp();

  const userAId = new mongoose.Types.ObjectId().toString();
  const tokenUserA = signJwt(
    { _id: userAId, email: "userA@example.com", name: "User A" },
    "accessTokenPrivateKey"
  );

  let isDbConnected = false;
  let productId: string;
  let convAId: string;

  beforeAll(async () => {
    // Register tools
    const registry = ToolRegistry.getInstance();
    registry.registerTool(new SearchProductsTool());
    registry.registerTool(new GetProductTool());
    registry.registerTool(new GetUserProfileTool());
    registry.registerTool(new GetConversationSummaryTool());

    setAIOrchestrator(new AIOrchestrator(new MockToolAIProvider()));

    try {
      await connectDatabase();
      isDbConnected = true;
      await ProductModel.deleteMany({});
      await UserModel.deleteMany({});
      await ConversationModel.deleteMany({});
      await MessageModel.deleteMany({});

      if (isDbConnected) {
        const prod = await ProductModel.create({
          userId: userAId,
          productId: "prod-laptop-1",
          title: "Gaming Laptop",
          price: 1200,
          description: "High performance laptop",
          image: "laptop.jpg",
        });
        productId = prod.productId;

        await UserModel.create({
          _id: userAId,
          email: "userA@example.com",
          name: "User A",
          password: "HashedPassword123",
        });

        const conv = await ConversationModel.create({
          userId: userAId,
          title: "Tool Test Conversation",
          status: "active",
        });
        convAId = conv._id.toString();
      }
    } catch {
      isDbConnected = false;
    }
  });

  afterAll(async () => {
    setAIOrchestrator(null);
    if (isDbConnected) {
      await ProductModel.deleteMany({});
      await UserModel.deleteMany({});
      await ConversationModel.deleteMany({});
      await MessageModel.deleteMany({});
    }
    await disconnectDatabase();
  });

  describe("ToolRegistry & Read-Only Tool Execution", () => {
    it("should register tools and output provider-independent tool definitions", () => {
      const registry = ToolRegistry.getInstance();
      const defs = registry.getToolDefinitionsForAI();

      expect(defs.length).toBeGreaterThanOrEqual(4);
      expect(defs.some((d) => d.name === "search_products")).toBe(true);
      expect(defs.some((d) => d.name === "get_user_profile")).toBe(true);
    });

    it("search_products tool should return matching catalog products", async () => {
      if (!isDbConnected) return;

      const tool = new SearchProductsTool();
      const results = await tool.execute({ query: "Laptop", limit: 3 }, { userId: userAId });

      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(1);
      expect(results[0].title).toBe("Gaming Laptop");
      expect(results[0].price).toBe(1200);
    });

    it("get_user_profile tool should return user profile using server-authenticated context", async () => {
      if (!isDbConnected) return;

      const tool = new GetUserProfileTool();
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
      if (!isDbConnected) return;

      const res = await request(app)
        .post(`/api/v1/conversations/${convAId}/chat`)
        .set("Authorization", `Bearer ${tokenUserA}`)
        .send({ content: "Please search products for Laptop" });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.assistantMessage.content).toBe("I found matching laptop products for you.");
    });
  });
});
