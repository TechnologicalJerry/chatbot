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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listConversationMessages = exports.createUserMessage = void 0;
var mongoose_1 = __importDefault(require("mongoose"));
var message_model_1 = __importDefault(require("./message.model"));
var conversation_model_1 = __importDefault(require("../conversations/conversation.model"));
var appError_1 = require("../../errors/appError");
var metrics_1 = require("../../infrastructure/metrics/metrics");
function createUserMessage(userId, conversationId, content) {
    return __awaiter(this, void 0, void 0, function () {
        var conversation, messageDoc, attempts, maxAttempts, latestMsg, nextSequence, err_1;
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
                    messageDoc = null;
                    attempts = 0;
                    maxAttempts = 3;
                    _a.label = 2;
                case 2:
                    if (!(attempts < maxAttempts && !messageDoc)) return [3 /*break*/, 8];
                    attempts++;
                    return [4 /*yield*/, message_model_1.default.findOne({ conversationId: conversationId })
                            .sort({ sequence: -1 })
                            .select("sequence")
                            .lean()];
                case 3:
                    latestMsg = _a.sent();
                    nextSequence = ((latestMsg === null || latestMsg === void 0 ? void 0 : latestMsg.sequence) || 0) + 1;
                    _a.label = 4;
                case 4:
                    _a.trys.push([4, 6, , 7]);
                    return [4 /*yield*/, message_model_1.default.create({
                            conversationId: conversationId,
                            userId: userId,
                            role: "user",
                            content: content,
                            contentType: "text",
                            sequence: nextSequence,
                            status: "completed",
                        })];
                case 5:
                    messageDoc = _a.sent();
                    return [3 /*break*/, 7];
                case 6:
                    err_1 = _a.sent();
                    if (err_1.code === 11000 && attempts < maxAttempts) {
                        // Race condition: sequence collision, retry next sequence
                        return [3 /*break*/, 2];
                    }
                    throw err_1;
                case 7: return [3 /*break*/, 2];
                case 8:
                    if (!messageDoc) {
                        throw appError_1.AppError.internal("Failed to allocate sequential message position");
                    }
                    // 3. Atomically update parent conversation messageCount and lastMessageAt
                    return [4 /*yield*/, conversation_model_1.default.updateOne({ _id: conversationId }, {
                            $inc: { messageCount: 1 },
                            $set: { lastMessageAt: messageDoc.createdAt },
                        })];
                case 9:
                    // 3. Atomically update parent conversation messageCount and lastMessageAt
                    _a.sent();
                    // 4. Increment Prometheus metric
                    metrics_1.messagesCreatedCounter.inc();
                    return [2 /*return*/, messageDoc];
            }
        });
    });
}
exports.createUserMessage = createUserMessage;
function listConversationMessages(userId, conversationId, options) {
    if (options === void 0) { options = {}; }
    return __awaiter(this, void 0, void 0, function () {
        var conversation, limit, query, cursorNum, items, hasMore, resultItems, nextCursor;
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
                    limit = Math.min(Math.max(options.limit || 50, 1), 100);
                    query = {
                        conversationId: conversationId,
                    };
                    if (options.cursor) {
                        cursorNum = Number(options.cursor);
                        if (!isNaN(cursorNum)) {
                            query.sequence = { $lt: cursorNum };
                        }
                        else if (mongoose_1.default.Types.ObjectId.isValid(options.cursor)) {
                            query._id = { $lt: options.cursor };
                        }
                    }
                    return [4 /*yield*/, message_model_1.default.find(query)
                            .sort({ sequence: -1 })
                            .limit(limit + 1)
                            .lean()];
                case 2:
                    items = _a.sent();
                    hasMore = items.length > limit;
                    resultItems = hasMore ? items.slice(0, limit) : items;
                    nextCursor = hasMore && resultItems.length > 0
                        ? String(resultItems[resultItems.length - 1].sequence)
                        : null;
                    // 3. Increment Prometheus metric
                    metrics_1.messagesReadCounter.inc();
                    return [2 /*return*/, {
                            items: resultItems,
                            nextCursor: nextCursor,
                            hasMore: hasMore,
                        }];
            }
        });
    });
}
exports.listConversationMessages = listConversationMessages;
