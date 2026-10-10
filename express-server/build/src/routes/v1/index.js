"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_routes_1 = __importDefault(require("../../modules/auth/auth.routes"));
const user_routes_1 = __importDefault(require("../../modules/users/user.routes"));
const product_routes_1 = __importDefault(require("../../modules/products/product.routes"));
const chat_routes_1 = __importDefault(require("../../modules/chat/chat.routes"));
const conversation_routes_1 = __importDefault(require("../../modules/conversations/conversation.routes"));
const memory_routes_1 = __importDefault(require("../../modules/memory/memory.routes"));
const knowledge_routes_1 = __importDefault(require("../../modules/knowledge/knowledge.routes"));
const v1Router = (0, express_1.Router)();
v1Router.use("/auth", auth_routes_1.default);
v1Router.use("/sessions", auth_routes_1.default); // Alias /sessions -> auth
v1Router.use("/users", user_routes_1.default);
v1Router.use("/products", product_routes_1.default);
v1Router.use("/chat", chat_routes_1.default);
v1Router.use("/conversations", conversation_routes_1.default);
v1Router.use("/memories", memory_routes_1.default);
v1Router.use("/knowledge/documents", knowledge_routes_1.default);
exports.default = v1Router;
