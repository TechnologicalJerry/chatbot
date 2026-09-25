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
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultQuotaManager = exports.InMemoryQuotaManager = void 0;
var env_1 = require("../../config/env");
var securityLogger_1 = require("./securityLogger");
var InMemoryQuotaManager = /** @class */ (function () {
    function InMemoryQuotaManager() {
        this.store = new Map();
    }
    InMemoryQuotaManager.prototype.getTodayKey = function () {
        return new Date().toISOString().split("T")[0];
    };
    InMemoryQuotaManager.prototype.getUserUsage = function (userId) {
        var today = this.getTodayKey();
        var existing = this.store.get(userId);
        if (!existing || existing.date !== today) {
            var newUsage = { date: today, tokens: 0, requests: 0 };
            this.store.set(userId, newUsage);
            return newUsage;
        }
        return existing;
    };
    InMemoryQuotaManager.prototype.checkQuota = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            var usage, maxTokens, maxRequests;
            return __generator(this, function (_a) {
                usage = this.getUserUsage(userId);
                maxTokens = env_1.env.AI_DAILY_TOKEN_LIMIT;
                maxRequests = env_1.env.AI_DAILY_REQUEST_LIMIT;
                if (usage.tokens >= maxTokens) {
                    (0, securityLogger_1.logSecurityEvent)({
                        eventType: "QUOTA_EXCEEDED",
                        userId: userId,
                        details: { type: "daily_tokens", current: usage.tokens, max: maxTokens },
                    });
                    return [2 /*return*/, {
                            allowed: false,
                            reason: "DAILY_TOKEN_QUOTA_EXCEEDED",
                            currentTokens: usage.tokens,
                            maxTokens: maxTokens,
                            currentRequests: usage.requests,
                            maxRequests: maxRequests,
                        }];
                }
                if (usage.requests >= maxRequests) {
                    (0, securityLogger_1.logSecurityEvent)({
                        eventType: "QUOTA_EXCEEDED",
                        userId: userId,
                        details: { type: "daily_requests", current: usage.requests, max: maxRequests },
                    });
                    return [2 /*return*/, {
                            allowed: false,
                            reason: "DAILY_REQUEST_QUOTA_EXCEEDED",
                            currentTokens: usage.tokens,
                            maxTokens: maxTokens,
                            currentRequests: usage.requests,
                            maxRequests: maxRequests,
                        }];
                }
                return [2 /*return*/, {
                        allowed: true,
                        currentTokens: usage.tokens,
                        maxTokens: maxTokens,
                        currentRequests: usage.requests,
                        maxRequests: maxRequests,
                    }];
            });
        });
    };
    InMemoryQuotaManager.prototype.recordUsage = function (userId, inputTokens, outputTokens) {
        return __awaiter(this, void 0, void 0, function () {
            var usage;
            return __generator(this, function (_a) {
                usage = this.getUserUsage(userId);
                usage.tokens += inputTokens + outputTokens;
                usage.requests += 1;
                return [2 /*return*/];
            });
        });
    };
    InMemoryQuotaManager.prototype.resetUserQuota = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                this.store.delete(userId);
                return [2 /*return*/];
            });
        });
    };
    return InMemoryQuotaManager;
}());
exports.InMemoryQuotaManager = InMemoryQuotaManager;
exports.defaultQuotaManager = new InMemoryQuotaManager();
