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
exports.deleteConversation = exports.updateConversation = exports.listUserConversations = exports.getConversationById = exports.createConversation = void 0;
var mongoose_1 = __importDefault(require("mongoose"));
var conversation_model_1 = __importDefault(require("./conversation.model"));
var appError_1 = require("../../errors/appError");
var metrics_1 = require("../../infrastructure/metrics/metrics");
function createConversation(userId, input) {
    return __awaiter(this, void 0, void 0, function () {
        var conversation;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, conversation_model_1.default.create({
                        userId: userId,
                        title: input.title || "New Conversation",
                        metadata: input.metadata || {},
                        status: "active",
                    })];
                case 1:
                    conversation = _a.sent();
                    metrics_1.conversationCreatedCounter.inc();
                    return [2 /*return*/, conversation];
            }
        });
    });
}
exports.createConversation = createConversation;
function getConversationById(userId, conversationId) {
    return __awaiter(this, void 0, void 0, function () {
        var conversation;
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
                        }).lean()];
                case 1:
                    conversation = _a.sent();
                    if (!conversation) {
                        throw appError_1.AppError.notFound("Conversation not found");
                    }
                    return [2 /*return*/, conversation];
            }
        });
    });
}
exports.getConversationById = getConversationById;
function listUserConversations(userId, options) {
    if (options === void 0) { options = {}; }
    return __awaiter(this, void 0, void 0, function () {
        var limit, status, query, items, hasMore, resultItems, nextCursor;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    limit = Math.min(Math.max(options.limit || 20, 1), 100);
                    status = options.status || "active";
                    query = {
                        userId: userId,
                        status: status,
                    };
                    if (options.cursor) {
                        if (mongoose_1.default.Types.ObjectId.isValid(options.cursor)) {
                            query._id = { $lt: options.cursor };
                        }
                    }
                    return [4 /*yield*/, conversation_model_1.default.find(query)
                            .sort({ updatedAt: -1, _id: -1 })
                            .limit(limit + 1)
                            .lean()];
                case 1:
                    items = _a.sent();
                    hasMore = items.length > limit;
                    resultItems = hasMore ? items.slice(0, limit) : items;
                    nextCursor = hasMore && resultItems.length > 0
                        ? String(resultItems[resultItems.length - 1]._id)
                        : null;
                    return [2 /*return*/, {
                            items: resultItems,
                            nextCursor: nextCursor,
                            hasMore: hasMore,
                        }];
            }
        });
    });
}
exports.listUserConversations = listUserConversations;
function updateConversation(userId, conversationId, input) {
    return __awaiter(this, void 0, void 0, function () {
        var updateFields, updated;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!mongoose_1.default.Types.ObjectId.isValid(conversationId)) {
                        throw appError_1.AppError.notFound("Conversation not found");
                    }
                    updateFields = {};
                    if (input.title !== undefined)
                        updateFields.title = input.title;
                    if (input.status !== undefined)
                        updateFields.status = input.status;
                    return [4 /*yield*/, conversation_model_1.default.findOneAndUpdate({
                            _id: conversationId,
                            userId: userId,
                            status: { $ne: "deleted" },
                        }, { $set: updateFields }, { new: true, runValidators: true }).lean()];
                case 1:
                    updated = _a.sent();
                    if (!updated) {
                        throw appError_1.AppError.notFound("Conversation not found");
                    }
                    return [2 /*return*/, updated];
            }
        });
    });
}
exports.updateConversation = updateConversation;
function deleteConversation(userId, conversationId) {
    return __awaiter(this, void 0, void 0, function () {
        var result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!mongoose_1.default.Types.ObjectId.isValid(conversationId)) {
                        throw appError_1.AppError.notFound("Conversation not found");
                    }
                    return [4 /*yield*/, conversation_model_1.default.findOneAndUpdate({
                            _id: conversationId,
                            userId: userId,
                            status: { $ne: "deleted" },
                        }, {
                            $set: {
                                status: "deleted",
                                deletedAt: new Date(),
                            },
                        })];
                case 1:
                    result = _a.sent();
                    if (!result) {
                        throw appError_1.AppError.notFound("Conversation not found");
                    }
                    metrics_1.conversationDeletedCounter.inc();
                    return [2 /*return*/];
            }
        });
    });
}
exports.deleteConversation = deleteConversation;
