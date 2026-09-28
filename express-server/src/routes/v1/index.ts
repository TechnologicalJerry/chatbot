import { Router } from "express";
import authRoutes from "../../modules/auth/auth.routes";
import userRoutes from "../../modules/users/user.routes";
import productRoutes from "../../modules/products/product.routes";
import chatRoutes from "../../modules/chat/chat.routes";
import conversationRoutes from "../../modules/conversations/conversation.routes";
import memoryRoutes from "../../modules/memory/memory.routes";
import knowledgeRoutes from "../../modules/knowledge/knowledge.routes";

const v1Router = Router();

v1Router.use("/auth", authRoutes);
v1Router.use("/sessions", authRoutes); // Alias /sessions -> auth
v1Router.use("/users", userRoutes);
v1Router.use("/products", productRoutes);
v1Router.use("/chat", chatRoutes);
v1Router.use("/conversations", conversationRoutes);
v1Router.use("/memories", memoryRoutes);
v1Router.use("/knowledge/documents", knowledgeRoutes);

export default v1Router;
