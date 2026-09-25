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
exports.distributedQuotaManager = exports.RedisQuotaService = void 0;
var quota_service_1 = require("./quota.service");
var redis_client_1 = require("../redis/redis.client");
var env_1 = require("../../config/env");
var securityLogger_1 = require("./securityLogger");
var logger_1 = __importDefault(require("../logger/logger"));
var RedisQuotaService = /** @class */ (function () {
    function RedisQuotaService() {
        this.fallbackManager = new quota_service_1.InMemoryQuotaManager();
    }
    RedisQuotaService.prototype.getTodayKey = function () {
        return new Date().toISOString().split("T")[0];
    };
    RedisQuotaService.prototype.checkQuota = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            var isHealthy, client, today, tokenKey, requestKey, _a, tokenRaw, requestRaw, currentTokens, currentRequests, maxTokens, maxRequests, err_1;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, redis_client_1.redisManager.isHealthy()];
                    case 1:
                        isHealthy = _b.sent();
                        if (!isHealthy) {
                            return [2 /*return*/, this.fallbackManager.checkQuota(userId)];
                        }
                        _b.label = 2;
                    case 2:
                        _b.trys.push([2, 4, , 5]);
                        client = redis_client_1.redisManager.getClient();
                        today = this.getTodayKey();
                        tokenKey = "quota:tokens:".concat(userId, ":").concat(today);
                        requestKey = "quota:requests:".concat(userId, ":").concat(today);
                        return [4 /*yield*/, Promise.all([client.get(tokenKey), client.get(requestKey)])];
                    case 3:
                        _a = _b.sent(), tokenRaw = _a[0], requestRaw = _a[1];
                        currentTokens = tokenRaw ? parseInt(tokenRaw, 10) : 0;
                        currentRequests = requestRaw ? parseInt(requestRaw, 10) : 0;
                        maxTokens = env_1.env.AI_DAILY_TOKEN_LIMIT;
                        maxRequests = env_1.env.AI_DAILY_REQUEST_LIMIT;
                        if (currentTokens >= maxTokens) {
                            (0, securityLogger_1.logSecurityEvent)({
                                eventType: "QUOTA_EXCEEDED",
                                userId: userId,
                                details: { type: "daily_tokens", current: currentTokens, max: maxTokens },
                            });
                            return [2 /*return*/, {
                                    allowed: false,
                                    reason: "DAILY_TOKEN_QUOTA_EXCEEDED",
                                    currentTokens: currentTokens,
                                    maxTokens: maxTokens,
                                    currentRequests: currentRequests,
                                    maxRequests: maxRequests,
                                }];
                        }
                        if (currentRequests >= maxRequests) {
                            (0, securityLogger_1.logSecurityEvent)({
                                eventType: "QUOTA_EXCEEDED",
                                userId: userId,
                                details: { type: "daily_requests", current: currentRequests, max: maxRequests },
                            });
                            return [2 /*return*/, {
                                    allowed: false,
                                    reason: "DAILY_REQUEST_QUOTA_EXCEEDED",
                                    currentTokens: currentTokens,
                                    maxTokens: maxTokens,
                                    currentRequests: currentRequests,
                                    maxRequests: maxRequests,
                                }];
                        }
                        return [2 /*return*/, {
                                allowed: true,
                                currentTokens: currentTokens,
                                maxTokens: maxTokens,
                                currentRequests: currentRequests,
                                maxRequests: maxRequests,
                            }];
                    case 4:
                        err_1 = _b.sent();
                        logger_1.default.warn({ err: err_1.message, userId: userId }, "Redis quota check failed, falling back to in-memory");
                        return [2 /*return*/, this.fallbackManager.checkQuota(userId)];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    RedisQuotaService.prototype.recordUsage = function (userId, inputTokens, outputTokens) {
        return __awaiter(this, void 0, void 0, function () {
            var isHealthy, client, today, tokenKey, requestKey, totalTokens, _a, newTokens, newRequests, err_2;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, redis_client_1.redisManager.isHealthy()];
                    case 1:
                        isHealthy = _b.sent();
                        if (!isHealthy) {
                            return [2 /*return*/, this.fallbackManager.recordUsage(userId, inputTokens, outputTokens)];
                        }
                        _b.label = 2;
                    case 2:
                        _b.trys.push([2, 8, , 10]);
                        client = redis_client_1.redisManager.getClient();
                        today = this.getTodayKey();
                        tokenKey = "quota:tokens:".concat(userId, ":").concat(today);
                        requestKey = "quota:requests:".concat(userId, ":").concat(today);
                        totalTokens = inputTokens + outputTokens;
                        return [4 /*yield*/, Promise.all([
                                client.incrby(tokenKey, totalTokens),
                                client.incr(requestKey),
                            ])];
                    case 3:
                        _a = _b.sent(), newTokens = _a[0], newRequests = _a[1];
                        if (!(newTokens === totalTokens)) return [3 /*break*/, 5];
                        return [4 /*yield*/, client.expire(tokenKey, 86400 * 2)];
                    case 4:
                        _b.sent(); // 2 days TTL
                        _b.label = 5;
                    case 5:
                        if (!(newRequests === 1)) return [3 /*break*/, 7];
                        return [4 /*yield*/, client.expire(requestKey, 86400 * 2)];
                    case 6:
                        _b.sent();
                        _b.label = 7;
                    case 7: return [3 /*break*/, 10];
                    case 8:
                        err_2 = _b.sent();
                        logger_1.default.warn({ err: err_2.message, userId: userId }, "Redis record quota usage failed");
                        return [4 /*yield*/, this.fallbackManager.recordUsage(userId, inputTokens, outputTokens)];
                    case 9:
                        _b.sent();
                        return [3 /*break*/, 10];
                    case 10: return [2 /*return*/];
                }
            });
        });
    };
    RedisQuotaService.prototype.resetUserQuota = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            var isHealthy, today, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, redis_client_1.redisManager.isHealthy()];
                    case 1:
                        isHealthy = _b.sent();
                        if (!isHealthy) return [3 /*break*/, 5];
                        _b.label = 2;
                    case 2:
                        _b.trys.push([2, 4, , 5]);
                        today = this.getTodayKey();
                        return [4 /*yield*/, redis_client_1.redisManager.getClient().del("quota:tokens:".concat(userId, ":").concat(today), "quota:requests:".concat(userId, ":").concat(today))];
                    case 3:
                        _b.sent();
                        return [3 /*break*/, 5];
                    case 4:
                        _a = _b.sent();
                        return [3 /*break*/, 5];
                    case 5: return [4 /*yield*/, this.fallbackManager.resetUserQuota(userId)];
                    case 6:
                        _b.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    return RedisQuotaService;
}());
exports.RedisQuotaService = RedisQuotaService;
exports.distributedQuotaManager = new RedisQuotaService();
