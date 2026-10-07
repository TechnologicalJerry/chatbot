"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.streamChatHandler = exports.postChatHandler = void 0;
const chat_service_1 = require("./chat.service");
const logger_1 = __importDefault(require("../../infrastructure/logger/logger"));
async function postChatHandler(req, res, next) {
    try {
        const userId = res.locals.user._id;
        const conversationId = req.params.conversationId;
        const content = req.body.content;
        const result = await (0, chat_service_1.processChatMessage)(userId, conversationId, content);
        return res.status(201).json({
            success: true,
            data: result,
        });
    }
    catch (err) {
        return next(err);
    }
}
exports.postChatHandler = postChatHandler;
async function streamChatHandler(req, res, next) {
    const userId = res.locals.user._id;
    const conversationId = req.params.conversationId;
    const content = req.body.content || req.query.content;
    let headersSet = false;
    let pingInterval = null;
    const abortController = new AbortController();
    const cleanup = () => {
        if (pingInterval) {
            clearInterval(pingInterval);
            pingInterval = null;
        }
    };
    req.on("close", () => {
        if (!res.writableEnded) {
            abortController.abort();
        }
        cleanup();
    });
    const sendEvent = (event, data) => {
        const payload = typeof data === "string" ? data : JSON.stringify(data);
        res.write(`event: ${event}\ndata: ${payload}\n\n`);
    };
    try {
        const result = await (0, chat_service_1.processStreamingChatMessage)(userId, conversationId, content, {
            signal: abortController.signal,
            onStart: (data) => {
                res.writeHead(200, {
                    "Content-Type": "text/event-stream",
                    "Cache-Control": "no-cache, no-transform",
                    Connection: "keep-alive",
                    "X-Accel-Buffering": "no",
                });
                headersSet = true;
                pingInterval = setInterval(() => {
                    if (!res.writableEnded) {
                        res.write(": ping\n\n");
                    }
                }, 15000);
                sendEvent("message.start", data);
            },
            onChunk: (chunk) => {
                if (chunk.type === "text_delta" && chunk.text) {
                    sendEvent("message.delta", { text: chunk.text });
                }
            },
        });
        if (!abortController.signal.aborted && headersSet) {
            sendEvent("message.completed", {
                userMessageId: result.userMessage._id,
                assistantMessageId: result.assistantMessage._id,
                usage: result.assistantMessage.tokenUsage,
                content: result.assistantMessage.content,
            });
            sendEvent("done", "[DONE]");
        }
    }
    catch (err) {
        cleanup();
        if (!headersSet && !res.headersSent) {
            return next(err);
        }
        logger_1.default.error({ err, conversationId }, "Error during chat streaming");
        if (!res.writableEnded) {
            sendEvent("error", {
                message: err.message || "An unexpected error occurred during streaming",
                statusCode: err.statusCode || 500,
            });
        }
    }
    finally {
        cleanup();
        if (headersSet && !res.writableEnded) {
            res.end();
        }
    }
}
exports.streamChatHandler = streamChatHandler;
