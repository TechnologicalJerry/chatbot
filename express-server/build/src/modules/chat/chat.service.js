"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processStreamingChatMessage = exports.processChatMessage = void 0;
var mongoose_1 = __importDefault(require("mongoose"));
var conversation_model_1 = __importDefault(require("../conversations/conversation.model"));
var message_model_1 = __importDefault(require("../messages/message.model"));
var message_service_1 = require("../messages/message.service");
var ai_factory_1 = require("../../infrastructure/ai/ai.factory");
var appError_1 = require("../../errors/appError");
var env_1 = require("../../config/env");
var metrics_1 = require("../../infrastructure/metrics/metrics");
var logger_1 = __importDefault(require("../../infrastructure/logger/logger"));
var context_service_1 = __importDefault(require("../../infrastructure/ai/context/context.service"));
var context_builder_1 = __importDefault(require("../../infrastructure/ai/context/context.builder"));
var conversationSummary_service_1 = __importDefault(require("../../infrastructure/ai/context/conversationSummary.service"));
var memory_service_1 = __importDefault(require("../memory/memory.service"));
function processChatMessage(userId, conversationId, content) {
    return __awaiter(this, void 0, void 0, function () {
        var conversation, userMessage, aiContext, aiInputMessages, startTime, orchestrator, aiResponse, err_1, assistantSeq_1, latency, assistantSeq, assistantMessage, updatedConv, backgroundErr_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!mongoose_1.default.Types.ObjectId.isValid(conversationId)) {
                        throw appError_1.AppError.notFound("Conversation not found");
                    }
                    return [4 /*yield*/, conversation_model_1.default.findOne({
                            _id: conversationId,
                            userId: userId,
                            status: { $ne: "deleted" },
                        })];
                case 1:
                    conversation = _a.sent();
                    if (!conversation) {
                        throw appError_1.AppError.notFound("Conversation not found");
                    }
                    return [4 /*yield*/, (0, message_service_1.createUserMessage)(userId, conversationId, content)];
                case 2:
                    userMessage = _a.sent();
                    return [4 /*yield*/, context_service_1.default.buildAIContext(userId, conversationId, content)];
                case 3:
                    aiContext = _a.sent();
                    aiInputMessages = context_builder_1.default.toChatMessageTrajectory(aiContext);
                    startTime = Date.now();
                    orchestrator = (0, ai_factory_1.getAIOrchestrator)();
                    _a.label = 4;
                case 4:
                    _a.trys.push([4, 6, , 8]);
                    return [4 /*yield*/, orchestrator.generateCompletion(aiInputMessages, {
                            model: env_1.env.OPENAI_MODEL,
                            executionContext: { userId: userId, conversationId: conversationId },
                        })];
                case 5:
                    aiResponse = _a.sent();
                    return [3 /*break*/, 8];
                case 6:
                    err_1 = _a.sent();
                    logger_1.default.error({ err: err_1, conversationId: conversationId, userMessageId: userMessage._id }, "AI completion generation failed during chat processing");
                    assistantSeq_1 = userMessage.sequence + 1;
                    return [4 /*yield*/, message_model_1.default.create({
                            conversationId: conversationId,
                            userId: userId,
                            role: "assistant",
                            content: "Failed to generate AI response.",
                            contentType: "text",
                            sequence: assistantSeq_1,
                            status: "failed",
                            model: env_1.env.OPENAI_MODEL,
                        })];
                case 7:
                    _a.sent();
                    throw err_1;
                case 8:
                    latency = Date.now() - startTime;
                    assistantSeq = userMessage.sequence + 1;
                    return [4 /*yield*/, message_model_1.default.create({
                            conversationId: conversationId,
                            userId: userId,
                            role: "assistant",
                            content: aiResponse.message.content,
                            contentType: "text",
                            sequence: assistantSeq,
                            status: "completed",
                            model: env_1.env.OPENAI_MODEL,
                            tokenUsage: aiResponse.usage,
                            latency: latency,
                        })];
                case 9:
                    assistantMessage = _a.sent();
                    return [4 /*yield*/, conversation_model_1.default.findOneAndUpdate({ _id: conversationId }, {
                            $inc: { messageCount: 1 },
                            $set: { lastMessageAt: assistantMessage.createdAt },
                        }, { new: true })];
                case 10:
                    updatedConv = _a.sent();
                    _a.label = 11;
                case 11:
                    _a.trys.push([11, 15, , 16]);
                    return [4 /*yield*/, memory_service_1.default.extractAndStoreMemories(userId, conversationId, content, assistantMessage.content)];
                case 12:
                    _a.sent();
                    if (!(updatedConv && conversationSummary_service_1.default.shouldSummarize(updatedConv))) return [3 /*break*/, 14];
                    return [4 /*yield*/, conversationSummary_service_1.default.generateAndUpdateSummary(conversationId)];
                case 13:
                    _a.sent();
                    _a.label = 14;
                case 14: return [3 /*break*/, 16];
                case 15:
                    backgroundErr_1 = _a.sent();
                    logger_1.default.error({ err: backgroundErr_1, conversationId: conversationId }, "Error during post-chat turn memory/summary processing");
                    return [3 /*break*/, 16];
                case 16: return [2 /*return*/, {
                        userMessage: userMessage,
                        assistantMessage: assistantMessage,
                    }];
            }
        });
    });
}
exports.processChatMessage = processChatMessage;
function processStreamingChatMessage(userId, conversationId, content, options) {
    var _a, e_1, _b, _c;
    var _d, _e, _f;
    return __awaiter(this, void 0, void 0, function () {
        var conversation, userMessage, assistantSeq, assistantMessage, aiContext, aiInputMessages, startTime, orchestrator, accumulatedText, tokenUsage, stream, _g, stream_1, stream_1_1, chunk, e_1_1, err_2, latency, updatedConv, backgroundErr_2, finalAssistantDoc;
        return __generator(this, function (_h) {
            switch (_h.label) {
                case 0:
                    if (!mongoose_1.default.Types.ObjectId.isValid(conversationId)) {
                        throw appError_1.AppError.notFound("Conversation not found");
                    }
                    return [4 /*yield*/, conversation_model_1.default.findOne({
                            _id: conversationId,
                            userId: userId,
                            status: { $ne: "deleted" },
                        })];
                case 1:
                    conversation = _h.sent();
                    if (!conversation) {
                        throw appError_1.AppError.notFound("Conversation not found");
                    }
                    return [4 /*yield*/, (0, message_service_1.createUserMessage)(userId, conversationId, content)];
                case 2:
                    userMessage = _h.sent();
                    assistantSeq = userMessage.sequence + 1;
                    return [4 /*yield*/, message_model_1.default.create({
                            conversationId: conversationId,
                            userId: userId,
                            role: "assistant",
                            content: "",
                            contentType: "text",
                            sequence: assistantSeq,
                            status: "streaming",
                            model: env_1.env.OPENAI_MODEL,
                        })];
                case 3:
                    assistantMessage = _h.sent();
                    if (options.onStart) {
                        options.onStart({
                            userMessageId: userMessage._id.toString(),
                            assistantMessageId: assistantMessage._id.toString(),
                            conversationId: conversationId,
                        });
                    }
                    return [4 /*yield*/, context_service_1.default.buildAIContext(userId, conversationId, content)];
                case 4:
                    aiContext = _h.sent();
                    aiInputMessages = context_builder_1.default.toChatMessageTrajectory(aiContext);
                    startTime = Date.now();
                    orchestrator = (0, ai_factory_1.getAIOrchestrator)();
                    accumulatedText = "";
                    _h.label = 5;
                case 5:
                    _h.trys.push([5, 18, , 22]);
                    stream = orchestrator.streamCompletion(aiInputMessages, {
                        model: env_1.env.OPENAI_MODEL,
                        signal: options.signal,
                        executionContext: { userId: userId, conversationId: conversationId },
                    });
                    _h.label = 6;
                case 6:
                    _h.trys.push([6, 11, 12, 17]);
                    _g = true, stream_1 = __asyncValues(stream);
                    _h.label = 7;
                case 7: return [4 /*yield*/, stream_1.next()];
                case 8:
                    if (!(stream_1_1 = _h.sent(), _a = stream_1_1.done, !_a)) return [3 /*break*/, 10];
                    _c = stream_1_1.value;
                    _g = false;
                    try {
                        chunk = _c;
                        if ((_d = options.signal) === null || _d === void 0 ? void 0 : _d.aborted) {
                            return [3 /*break*/, 10];
                        }
                        if (chunk.type === "text_delta" && chunk.text) {
                            accumulatedText += chunk.text;
                        }
                        if (chunk.type === "completion" && chunk.usage) {
                            tokenUsage = chunk.usage;
                        }
                        options.onChunk(chunk);
                    }
                    finally {
                        _g = true;
                    }
                    _h.label = 9;
                case 9: return [3 /*break*/, 7];
                case 10: return [3 /*break*/, 17];
                case 11:
                    e_1_1 = _h.sent();
                    e_1 = { error: e_1_1 };
                    return [3 /*break*/, 17];
                case 12:
                    _h.trys.push([12, , 15, 16]);
                    if (!(!_g && !_a && (_b = stream_1.return))) return [3 /*break*/, 14];
                    return [4 /*yield*/, _b.call(stream_1)];
                case 13:
                    _h.sent();
                    _h.label = 14;
                case 14: return [3 /*break*/, 16];
                case 15:
                    if (e_1) throw e_1.error;
                    return [7 /*endfinally*/];
                case 16: return [7 /*endfinally*/];
                case 17: return [3 /*break*/, 22];
                case 18:
                    err_2 = _h.sent();
                    if (!((_e = options.signal) === null || _e === void 0 ? void 0 : _e.aborted)) return [3 /*break*/, 20];
                    return [4 /*yield*/, message_model_1.default.updateOne({ _id: assistantMessage._id }, {
                            $set: {
                                status: "cancelled",
                                content: accumulatedText,
                                metadata: { cancelledAt: new Date() },
                            },
                        })];
                case 19:
                    _h.sent();
                    metrics_1.chatStreamRequestsCounter.inc({ status: "cancelled" });
                    return [2 /*return*/, { userMessage: userMessage, assistantMessage: assistantMessage }];
                case 20: return [4 /*yield*/, message_model_1.default.updateOne({ _id: assistantMessage._id }, {
                        $set: {
                            status: "failed",
                            content: accumulatedText || "Failed during streaming",
                        },
                    })];
                case 21:
                    _h.sent();
                    metrics_1.chatStreamRequestsCounter.inc({ status: "failed" });
                    throw err_2;
                case 22:
                    if (!((_f = options.signal) === null || _f === void 0 ? void 0 : _f.aborted)) return [3 /*break*/, 24];
                    return [4 /*yield*/, message_model_1.default.updateOne({ _id: assistantMessage._id }, {
                            $set: {
                                status: "cancelled",
                                content: accumulatedText,
                                metadata: { cancelledAt: new Date() },
                            },
                        })];
                case 23:
                    _h.sent();
                    metrics_1.chatStreamRequestsCounter.inc({ status: "cancelled" });
                    return [2 /*return*/, { userMessage: userMessage, assistantMessage: assistantMessage }];
                case 24:
                    latency = Date.now() - startTime;
                    // 6. Complete Assistant Message
                    return [4 /*yield*/, message_model_1.default.updateOne({ _id: assistantMessage._id }, {
                            $set: {
                                status: "completed",
                                content: accumulatedText,
                                tokenUsage: tokenUsage,
                                latency: latency,
                            },
                        })];
                case 25:
                    // 6. Complete Assistant Message
                    _h.sent();
                    return [4 /*yield*/, conversation_model_1.default.findOneAndUpdate({ _id: conversationId }, {
                            $inc: { messageCount: 1 },
                            $set: { lastMessageAt: new Date() },
                        }, { new: true })];
                case 26:
                    updatedConv = _h.sent();
                    metrics_1.chatStreamRequestsCounter.inc({ status: "completed" });
                    _h.label = 27;
                case 27:
                    _h.trys.push([27, 31, , 32]);
                    return [4 /*yield*/, memory_service_1.default.extractAndStoreMemories(userId, conversationId, content, accumulatedText)];
                case 28:
                    _h.sent();
                    if (!(updatedConv && conversationSummary_service_1.default.shouldSummarize(updatedConv))) return [3 /*break*/, 30];
                    return [4 /*yield*/, conversationSummary_service_1.default.generateAndUpdateSummary(conversationId)];
                case 29:
                    _h.sent();
                    _h.label = 30;
                case 30: return [3 /*break*/, 32];
                case 31:
                    backgroundErr_2 = _h.sent();
                    logger_1.default.error({ err: backgroundErr_2, conversationId: conversationId }, "Error during streaming post-chat turn memory/summary processing");
                    return [3 /*break*/, 32];
                case 32: return [4 /*yield*/, message_model_1.default.findById(assistantMessage._id)];
                case 33:
                    finalAssistantDoc = (_h.sent());
                    return [2 /*return*/, {
                            userMessage: userMessage,
                            assistantMessage: finalAssistantDoc || assistantMessage,
                        }];
            }
        });
    });
}
exports.processStreamingChatMessage = processStreamingChatMessage;
