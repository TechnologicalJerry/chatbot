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
exports.idempotencyMiddleware = void 0;
var redis_client_1 = require("../infrastructure/redis/redis.client");
var env_1 = require("../config/env");
var logger_1 = __importDefault(require("../infrastructure/logger/logger"));
var constants_1 = require("../config/constants");
function idempotencyMiddleware(req, res, next) {
    return __awaiter(this, void 0, void 0, function () {
        var idempotencyKey, isHealthy, user, userId, redisKey, client, existing, requestId, cached, originalJson_1, err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    idempotencyKey = req.headers["idempotency-key"];
                    // If no idempotency key provided, bypass
                    if (!idempotencyKey || !idempotencyKey.trim()) {
                        return [2 /*return*/, next()];
                    }
                    return [4 /*yield*/, redis_client_1.redisManager.isHealthy()];
                case 1:
                    isHealthy = _a.sent();
                    if (!isHealthy) {
                        return [2 /*return*/, next()]; // Fail open if Redis is down
                    }
                    user = res.locals.user;
                    userId = (user === null || user === void 0 ? void 0 : user._id) || (user === null || user === void 0 ? void 0 : user.id) || "anon";
                    redisKey = "idempotency:".concat(userId, ":").concat(idempotencyKey.trim());
                    client = redis_client_1.redisManager.getClient();
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 5, , 6]);
                    return [4 /*yield*/, client.get(redisKey)];
                case 3:
                    existing = _a.sent();
                    if (existing) {
                        if (existing === "IN_PROGRESS") {
                            requestId = (req.headers[constants_1.HEADER_REQUEST_ID] || res.getHeader(constants_1.HEADER_REQUEST_ID) || "unknown");
                            return [2 /*return*/, res.status(409).json({
                                    success: false,
                                    error: {
                                        code: "DUPLICATE_IN_PROGRESS",
                                        message: "A request with this Idempotency-Key is currently processing.",
                                    },
                                    requestId: requestId,
                                })];
                        }
                        cached = JSON.parse(existing);
                        res.setHeader("X-Cache-Lookup", "HIT-IDEMPOTENT");
                        return [2 /*return*/, res.status(cached.status).json(cached.body)];
                    }
                    // Set lock value IN_PROGRESS for 60 seconds while handling
                    return [4 /*yield*/, client.set(redisKey, "IN_PROGRESS", "EX", 60)];
                case 4:
                    // Set lock value IN_PROGRESS for 60 seconds while handling
                    _a.sent();
                    originalJson_1 = res.json.bind(res);
                    res.json = function (body) {
                        if (res.statusCode >= 200 && res.statusCode < 300) {
                            var cachePayload = JSON.stringify({
                                status: res.statusCode,
                                body: body,
                            });
                            client.set(redisKey, cachePayload, "EX", env_1.env.IDEMPOTENCY_TTL_SECONDS).catch(function (err) {
                                logger_1.default.warn({ err: err.message }, "Failed to cache idempotent response");
                            });
                        }
                        else {
                            client.del(redisKey).catch(function () { });
                        }
                        return originalJson_1(body);
                    };
                    return [2 /*return*/, next()];
                case 5:
                    err_1 = _a.sent();
                    logger_1.default.warn({ err: err_1.message }, "Idempotency check error");
                    return [2 /*return*/, next()];
                case 6: return [2 /*return*/];
            }
        });
    });
}
exports.idempotencyMiddleware = idempotencyMiddleware;
