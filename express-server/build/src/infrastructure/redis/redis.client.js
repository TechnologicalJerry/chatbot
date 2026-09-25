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
exports.getRedisClient = exports.redisManager = void 0;
var ioredis_1 = __importDefault(require("ioredis"));
var env_1 = require("../../config/env");
var logger_1 = __importDefault(require("../logger/logger"));
var RedisClientManager = /** @class */ (function () {
    function RedisClientManager() {
        this.redisClient = null;
        this.isConnected = false;
    }
    RedisClientManager.getInstance = function () {
        if (!RedisClientManager.instance) {
            RedisClientManager.instance = new RedisClientManager();
        }
        return RedisClientManager.instance;
    };
    RedisClientManager.prototype.getClient = function () {
        var _this = this;
        if (!this.redisClient) {
            this.redisClient = new ioredis_1.default(env_1.env.REDIS_URL, {
                connectTimeout: env_1.env.REDIS_CONNECT_TIMEOUT,
                maxRetriesPerRequest: null,
                enableReadyCheck: true,
                lazyConnect: true,
                retryStrategy: function (times) {
                    var delay = Math.min(times * 100, 3000);
                    return delay;
                },
            });
            this.redisClient.on("connect", function () {
                _this.isConnected = true;
                logger_1.default.info("Redis client connected successfully");
            });
            this.redisClient.on("error", function (err) {
                _this.isConnected = false;
                logger_1.default.error({ err: err.message }, "Redis connection error");
            });
            this.redisClient.on("close", function () {
                _this.isConnected = false;
                logger_1.default.info("Redis connection closed");
            });
        }
        return this.redisClient;
    };
    RedisClientManager.prototype.connect = function () {
        return __awaiter(this, void 0, void 0, function () {
            var client, err_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        client = this.getClient();
                        if (client.status === "ready" || client.status === "connecting") {
                            return [2 /*return*/, true];
                        }
                        return [4 /*yield*/, client.connect()];
                    case 1:
                        _a.sent();
                        this.isConnected = true;
                        return [2 /*return*/, true];
                    case 2:
                        err_1 = _a.sent();
                        this.isConnected = false;
                        logger_1.default.warn({ err: err_1.message }, "Redis server unavailable");
                        return [2 /*return*/, false];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    RedisClientManager.prototype.isHealthy = function () {
        return __awaiter(this, void 0, void 0, function () {
            var res, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        if (!this.redisClient || this.redisClient.status !== "ready") {
                            return [2 /*return*/, false];
                        }
                        return [4 /*yield*/, this.redisClient.ping()];
                    case 1:
                        res = _b.sent();
                        return [2 /*return*/, res === "PONG"];
                    case 2:
                        _a = _b.sent();
                        return [2 /*return*/, false];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    RedisClientManager.prototype.disconnect = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!this.redisClient) return [3 /*break*/, 5];
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, 4, 5]);
                        return [4 /*yield*/, this.redisClient.quit()];
                    case 2:
                        _b.sent();
                        logger_1.default.info("Redis disconnected gracefully");
                        return [3 /*break*/, 5];
                    case 3:
                        _a = _b.sent();
                        this.redisClient.disconnect();
                        return [3 /*break*/, 5];
                    case 4:
                        this.redisClient = null;
                        this.isConnected = false;
                        return [7 /*endfinally*/];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    return RedisClientManager;
}());
exports.redisManager = RedisClientManager.getInstance();
function getRedisClient() {
    return exports.redisManager.getClient();
}
exports.getRedisClient = getRedisClient;
