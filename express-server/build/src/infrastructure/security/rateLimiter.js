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
exports.defaultRateLimiter = exports.InMemoryRateLimiter = void 0;
var InMemoryRateLimiter = /** @class */ (function () {
    function InMemoryRateLimiter() {
        this.store = new Map();
    }
    InMemoryRateLimiter.prototype.consume = function (key, windowMs, maxHits) {
        return __awaiter(this, void 0, void 0, function () {
            var now, windowStart, record, oldestInWindow, resetTimeMs_1, resetTimeMs;
            return __generator(this, function (_a) {
                now = Date.now();
                windowStart = now - windowMs;
                record = this.store.get(key);
                if (!record) {
                    record = { timestamps: [] };
                    this.store.set(key, record);
                }
                // Filter out old timestamps outside window
                record.timestamps = record.timestamps.filter(function (ts) { return ts > windowStart; });
                if (record.timestamps.length >= maxHits) {
                    oldestInWindow = record.timestamps[0];
                    resetTimeMs_1 = oldestInWindow + windowMs;
                    return [2 /*return*/, {
                            allowed: false,
                            currentHits: record.timestamps.length,
                            maxHits: maxHits,
                            remainingHits: 0,
                            resetTimeMs: resetTimeMs_1,
                        }];
                }
                record.timestamps.push(now);
                resetTimeMs = record.timestamps[0] + windowMs;
                return [2 /*return*/, {
                        allowed: true,
                        currentHits: record.timestamps.length,
                        maxHits: maxHits,
                        remainingHits: Math.max(0, maxHits - record.timestamps.length),
                        resetTimeMs: resetTimeMs,
                    }];
            });
        });
    };
    InMemoryRateLimiter.prototype.check = function (key, windowMs, maxHits) {
        return __awaiter(this, void 0, void 0, function () {
            var now, windowStart, record, validTimestamps, allowed, resetTimeMs;
            return __generator(this, function (_a) {
                now = Date.now();
                windowStart = now - windowMs;
                record = this.store.get(key);
                validTimestamps = record ? record.timestamps.filter(function (ts) { return ts > windowStart; }) : [];
                allowed = validTimestamps.length < maxHits;
                resetTimeMs = validTimestamps.length > 0 ? validTimestamps[0] + windowMs : now + windowMs;
                return [2 /*return*/, {
                        allowed: allowed,
                        currentHits: validTimestamps.length,
                        maxHits: maxHits,
                        remainingHits: Math.max(0, maxHits - validTimestamps.length),
                        resetTimeMs: resetTimeMs,
                    }];
            });
        });
    };
    InMemoryRateLimiter.prototype.reset = function (key) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                this.store.delete(key);
                return [2 /*return*/];
            });
        });
    };
    return InMemoryRateLimiter;
}());
exports.InMemoryRateLimiter = InMemoryRateLimiter;
exports.defaultRateLimiter = new InMemoryRateLimiter();
