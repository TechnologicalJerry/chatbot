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
exports.CacheService = void 0;
var redis_client_1 = require("../redis/redis.client");
var env_1 = require("../../config/env");
var logger_1 = __importDefault(require("../logger/logger"));
var CacheService = /** @class */ (function () {
    function CacheService() {
    }
    CacheService.formatUserKey = function (userId, key) {
        return "cache:user:".concat(userId, ":").concat(key);
    };
    CacheService.get = function (userId, key) {
        return __awaiter(this, void 0, void 0, function () {
            var isHealthy, redisKey, raw, err_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, redis_client_1.redisManager.isHealthy()];
                    case 1:
                        isHealthy = _a.sent();
                        if (!isHealthy)
                            return [2 /*return*/, null];
                        redisKey = CacheService.formatUserKey(userId, key);
                        return [4 /*yield*/, redis_client_1.redisManager.getClient().get(redisKey)];
                    case 2:
                        raw = _a.sent();
                        if (!raw)
                            return [2 /*return*/, null];
                        return [2 /*return*/, JSON.parse(raw)];
                    case 3:
                        err_1 = _a.sent();
                        logger_1.default.warn({ err: err_1.message, userId: userId, key: key }, "Cache GET failed");
                        return [2 /*return*/, null];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    CacheService.set = function (userId, key, value, ttlSeconds) {
        if (ttlSeconds === void 0) { ttlSeconds = env_1.env.CACHE_DEFAULT_TTL; }
        return __awaiter(this, void 0, void 0, function () {
            var isHealthy, redisKey, raw, err_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, redis_client_1.redisManager.isHealthy()];
                    case 1:
                        isHealthy = _a.sent();
                        if (!isHealthy)
                            return [2 /*return*/, false];
                        redisKey = CacheService.formatUserKey(userId, key);
                        raw = JSON.stringify(value);
                        return [4 /*yield*/, redis_client_1.redisManager.getClient().set(redisKey, raw, "EX", ttlSeconds)];
                    case 2:
                        _a.sent();
                        return [2 /*return*/, true];
                    case 3:
                        err_2 = _a.sent();
                        logger_1.default.warn({ err: err_2.message, userId: userId, key: key }, "Cache SET failed");
                        return [2 /*return*/, false];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    CacheService.delete = function (userId, key) {
        return __awaiter(this, void 0, void 0, function () {
            var isHealthy, redisKey, err_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, redis_client_1.redisManager.isHealthy()];
                    case 1:
                        isHealthy = _a.sent();
                        if (!isHealthy)
                            return [2 /*return*/, false];
                        redisKey = CacheService.formatUserKey(userId, key);
                        return [4 /*yield*/, redis_client_1.redisManager.getClient().del(redisKey)];
                    case 2:
                        _a.sent();
                        return [2 /*return*/, true];
                    case 3:
                        err_3 = _a.sent();
                        logger_1.default.warn({ err: err_3.message, userId: userId, key: key }, "Cache DELETE failed");
                        return [2 /*return*/, false];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    CacheService.getOrSet = function (userId, key, fetcher, ttlSeconds) {
        if (ttlSeconds === void 0) { ttlSeconds = env_1.env.CACHE_DEFAULT_TTL; }
        return __awaiter(this, void 0, void 0, function () {
            var cached, fetched;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, CacheService.get(userId, key)];
                    case 1:
                        cached = _a.sent();
                        if (cached !== null) {
                            return [2 /*return*/, cached];
                        }
                        return [4 /*yield*/, fetcher()];
                    case 2:
                        fetched = _a.sent();
                        if (!(fetched !== null && fetched !== undefined)) return [3 /*break*/, 4];
                        return [4 /*yield*/, CacheService.set(userId, key, fetched, ttlSeconds)];
                    case 3:
                        _a.sent();
                        _a.label = 4;
                    case 4: return [2 /*return*/, fetched];
                }
            });
        });
    };
    return CacheService;
}());
exports.CacheService = CacheService;
exports.default = CacheService;
