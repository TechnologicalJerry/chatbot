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
exports.ingestionRateLimiter = exports.chatRateLimiter = exports.authRateLimiter = exports.createRateLimiterMiddleware = void 0;
var rateLimiter_1 = require("../infrastructure/security/rateLimiter");
var securityLogger_1 = require("../infrastructure/security/securityLogger");
var env_1 = require("../config/env");
var constants_1 = require("../config/constants");
function createRateLimiterMiddleware(options) {
    var _this = this;
    var windowMs = options.windowMs, maxHits = options.maxHits, rateLimitType = options.rateLimitType, _a = options.keyGenerator, keyGenerator = _a === void 0 ? function (req) {
        var user = resGetLocalUser(req);
        return (user === null || user === void 0 ? void 0 : user._id) || req.ip || "unknown";
    } : _a, _b = options.rateLimiter, rateLimiter = _b === void 0 ? rateLimiter_1.defaultRateLimiter : _b;
    return function (req, res, next) { return __awaiter(_this, void 0, void 0, function () {
        var key, result, requestId, userId;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (!env_1.env.RATE_LIMIT_ENABLED) {
                        return [2 /*return*/, next()];
                    }
                    key = "".concat(rateLimitType, ":").concat(keyGenerator(req));
                    return [4 /*yield*/, rateLimiter.consume(key, windowMs, maxHits)];
                case 1:
                    result = _b.sent();
                    res.setHeader("X-RateLimit-Limit", result.maxHits);
                    res.setHeader("X-RateLimit-Remaining", result.remainingHits);
                    res.setHeader("X-RateLimit-Reset", Math.ceil(result.resetTimeMs / 1000));
                    if (!result.allowed) {
                        requestId = (req.headers[constants_1.HEADER_REQUEST_ID] || res.getHeader(constants_1.HEADER_REQUEST_ID) || "unknown");
                        userId = (_a = resGetLocalUser(req)) === null || _a === void 0 ? void 0 : _a._id;
                        (0, securityLogger_1.logSecurityEvent)({
                            eventType: "RATE_LIMIT_EXCEEDED",
                            requestId: requestId,
                            userId: userId,
                            ip: req.ip,
                            endpoint: req.originalUrl,
                            details: { type: rateLimitType, currentHits: result.currentHits, maxHits: result.maxHits },
                        });
                        return [2 /*return*/, res.status(429).json({
                                success: false,
                                error: {
                                    code: "RATE_LIMIT_EXCEEDED",
                                    message: "Too many requests for ".concat(rateLimitType, ". Please try again later."),
                                },
                                requestId: requestId,
                            })];
                    }
                    return [2 /*return*/, next()];
            }
        });
    }); };
}
exports.createRateLimiterMiddleware = createRateLimiterMiddleware;
function resGetLocalUser(req) {
    var _a, _b;
    // express stores locals on res, but req might have res attached in express or express handlers access res.locals
    // In Express, res is passed separately
    return ((_b = (_a = req.res) === null || _a === void 0 ? void 0 : _a.locals) === null || _b === void 0 ? void 0 : _b.user) || req.user;
}
// Auth Rate Limiter (key on IP + account payload if available)
exports.authRateLimiter = createRateLimiterMiddleware({
    windowMs: 15 * 60 * 1000,
    maxHits: env_1.env.AUTH_RATE_LIMIT_MAX,
    rateLimitType: "auth",
    keyGenerator: function (req) {
        var _a, _b;
        var email = ((_a = req.body) === null || _a === void 0 ? void 0 : _a.email) || ((_b = req.body) === null || _b === void 0 ? void 0 : _b.username) || "";
        return "".concat(req.ip, ":").concat(email);
    },
});
// Chat Rate Limiter (key on userId or IP)
exports.chatRateLimiter = createRateLimiterMiddleware({
    windowMs: 60 * 1000,
    maxHits: env_1.env.CHAT_RATE_LIMIT_MAX,
    rateLimitType: "chat",
    keyGenerator: function (req) {
        var _a, _b;
        var user = (_b = (_a = req.res) === null || _a === void 0 ? void 0 : _a.locals) === null || _b === void 0 ? void 0 : _b.user;
        return (user === null || user === void 0 ? void 0 : user._id) || (user === null || user === void 0 ? void 0 : user.id) || req.ip || "anon";
    },
});
// Ingestion Rate Limiter (key on userId or IP)
exports.ingestionRateLimiter = createRateLimiterMiddleware({
    windowMs: 15 * 60 * 1000,
    maxHits: env_1.env.INGESTION_RATE_LIMIT_MAX,
    rateLimitType: "ingestion",
    keyGenerator: function (req) {
        var _a, _b;
        var user = (_b = (_a = req.res) === null || _a === void 0 ? void 0 : _a.locals) === null || _b === void 0 ? void 0 : _b.user;
        return (user === null || user === void 0 ? void 0 : user._id) || (user === null || user === void 0 ? void 0 : user.id) || req.ip || "anon";
    },
});
