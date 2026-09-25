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
exports.distributedRateLimiter = exports.RedisRateLimiter = void 0;
var rateLimiter_1 = require("./rateLimiter");
var redis_client_1 = require("../redis/redis.client");
var logger_1 = __importDefault(require("../logger/logger"));
var RedisRateLimiter = /** @class */ (function () {
    function RedisRateLimiter() {
        this.fallbackLimiter = new rateLimiter_1.InMemoryRateLimiter();
    }
    RedisRateLimiter.prototype.consume = function (key, windowMs, maxHits) {
        return __awaiter(this, void 0, void 0, function () {
            var isHealthy, client, redisKey, ttlSeconds, hits, pttl, resetTimeMs, allowed, remainingHits, err_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, redis_client_1.redisManager.isHealthy()];
                    case 1:
                        isHealthy = _a.sent();
                        if (!isHealthy) {
                            return [2 /*return*/, this.fallbackLimiter.consume(key, windowMs, maxHits)];
                        }
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 7, , 8]);
                        client = redis_client_1.redisManager.getClient();
                        redisKey = "ratelimit:".concat(key);
                        ttlSeconds = Math.ceil(windowMs / 1000);
                        return [4 /*yield*/, client.incr(redisKey)];
                    case 3:
                        hits = _a.sent();
                        if (!(hits === 1)) return [3 /*break*/, 5];
                        return [4 /*yield*/, client.expire(redisKey, ttlSeconds)];
                    case 4:
                        _a.sent();
                        _a.label = 5;
                    case 5: return [4 /*yield*/, client.pttl(redisKey)];
                    case 6:
                        pttl = _a.sent();
                        resetTimeMs = Date.now() + (pttl > 0 ? pttl : windowMs);
                        allowed = hits <= maxHits;
                        remainingHits = Math.max(0, maxHits - hits);
                        return [2 /*return*/, {
                                allowed: allowed,
                                currentHits: hits,
                                maxHits: maxHits,
                                remainingHits: remainingHits,
                                resetTimeMs: resetTimeMs,
                            }];
                    case 7:
                        err_1 = _a.sent();
                        logger_1.default.warn({ err: err_1.message, key: key }, "Redis rate limit failed, falling back to in-memory");
                        return [2 /*return*/, this.fallbackLimiter.consume(key, windowMs, maxHits)];
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    RedisRateLimiter.prototype.check = function (key, windowMs, maxHits) {
        return __awaiter(this, void 0, void 0, function () {
            var isHealthy, client, redisKey, raw, hits, pttl, resetTimeMs, allowed, err_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, redis_client_1.redisManager.isHealthy()];
                    case 1:
                        isHealthy = _a.sent();
                        if (!isHealthy) {
                            return [2 /*return*/, this.fallbackLimiter.check(key, windowMs, maxHits)];
                        }
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 5, , 6]);
                        client = redis_client_1.redisManager.getClient();
                        redisKey = "ratelimit:".concat(key);
                        return [4 /*yield*/, client.get(redisKey)];
                    case 3:
                        raw = _a.sent();
                        hits = raw ? parseInt(raw, 10) : 0;
                        return [4 /*yield*/, client.pttl(redisKey)];
                    case 4:
                        pttl = _a.sent();
                        resetTimeMs = Date.now() + (pttl > 0 ? pttl : windowMs);
                        allowed = hits < maxHits;
                        return [2 /*return*/, {
                                allowed: allowed,
                                currentHits: hits,
                                maxHits: maxHits,
                                remainingHits: Math.max(0, maxHits - hits),
                                resetTimeMs: resetTimeMs,
                            }];
                    case 5:
                        err_2 = _a.sent();
                        logger_1.default.warn({ err: err_2.message, key: key }, "Redis rate limit check failed");
                        return [2 /*return*/, this.fallbackLimiter.check(key, windowMs, maxHits)];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    RedisRateLimiter.prototype.reset = function (key) {
        return __awaiter(this, void 0, void 0, function () {
            var isHealthy, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, redis_client_1.redisManager.isHealthy()];
                    case 1:
                        isHealthy = _b.sent();
                        if (!isHealthy) return [3 /*break*/, 5];
                        _b.label = 2;
                    case 2:
                        _b.trys.push([2, 4, , 5]);
                        return [4 /*yield*/, redis_client_1.redisManager.getClient().del("ratelimit:".concat(key))];
                    case 3:
                        _b.sent();
                        return [3 /*break*/, 5];
                    case 4:
                        _a = _b.sent();
                        return [3 /*break*/, 5];
                    case 5: return [4 /*yield*/, this.fallbackLimiter.reset(key)];
                    case 6:
                        _b.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    return RedisRateLimiter;
}());
exports.RedisRateLimiter = RedisRateLimiter;
exports.distributedRateLimiter = new RedisRateLimiter();
