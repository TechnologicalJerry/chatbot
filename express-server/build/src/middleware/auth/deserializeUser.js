"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deserializeUser = void 0;
const lodash_1 = require("lodash");
const jwt_utils_1 = require("../../utils/jwt.utils");
const session_service_1 = require("../../modules/auth/session.service");
const session_model_1 = __importDefault(require("../../modules/auth/session.model"));
const deserializeUser = async (req, res, next) => {
    const accessToken = (0, lodash_1.get)(req, "headers.authorization", "").replace(/^Bearer\s/, "");
    const refreshToken = (0, lodash_1.get)(req, "headers.x-refresh");
    if (!accessToken) {
        return next();
    }
    const { decoded, expired } = (0, jwt_utils_1.verifyJwt)(accessToken, "accessTokenPublicKey");
    if (decoded) {
        // Verify session validity in DB if session ID is in payload
        const sessionId = (0, lodash_1.get)(decoded, "session");
        if (sessionId) {
            try {
                const session = await session_model_1.default.findById(sessionId);
                if (!session || !session.valid) {
                    return next();
                }
            }
            catch { }
        }
        res.locals.user = decoded;
        return next();
    }
    if (expired && refreshToken) {
        const newAccessToken = await (0, session_service_1.reIssueAccessToken)({ refreshToken });
        if (newAccessToken) {
            res.setHeader("x-access-token", newAccessToken);
            const result = (0, jwt_utils_1.verifyJwt)(newAccessToken, "accessTokenPublicKey");
            res.locals.user = result.decoded;
        }
        return next();
    }
    return next();
};
exports.deserializeUser = deserializeUser;
exports.default = exports.deserializeUser;
