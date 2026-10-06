import { Request, Response, NextFunction } from "express";
import { processChatMessage, processStreamingChatMessage } from "./chat.service";
import logger from "../../infrastructure/logger/logger";

export async function postChatHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = res.locals.user._id;
    const conversationId = req.params.conversationId;
    const content = req.body.content;

    const result = await processChatMessage(userId, conversationId, content);
    return res.status(201).json({
      success: true,
      data: result,
    });
  } catch (err) {
    return next(err);
  }
}

export async function streamChatHandler(req: Request, res: Response, next: NextFunction) {
  const userId = res.locals.user._id;
  const conversationId = req.params.conversationId;
  const content = req.body.content || req.query.content;
  let headersSet = false;
  let pingInterval: any = null;
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

  const sendEvent = (event: string, data: any) => {
    const payload = typeof data === "string" ? data : JSON.stringify(data);
    res.write(`event: ${event}\ndata: ${payload}\n\n`);
  };

  try {
    const result = await processStreamingChatMessage(userId, conversationId, content, {
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
  } catch (err: any) {
    cleanup();
    if (!headersSet && !res.headersSent) {
      return next(err);
    }
    logger.error({ err, conversationId }, "Error during chat streaming");
    if (!res.writableEnded) {
      sendEvent("error", {
        message: err.message || "An unexpected error occurred during streaming",
        statusCode: err.statusCode || 500,
      });
    }
  } finally {
    cleanup();
    if (headersSet && !res.writableEnded) {
      res.end();
    }
  }
}
