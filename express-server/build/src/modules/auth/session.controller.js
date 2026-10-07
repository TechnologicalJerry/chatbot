"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteSessionHandler = exports.getUserSessionsHandler = exports.createUserSessionHandler = void 0;
const config_1 = __importDefault(require("config"));
const session_service_1 = require("./session.service");
const user_service_1 = require("../users/user.service");
const jwt_utils_1 = require("../../utils/jwt.utils");
async function createUserSessionHandler(req, res) {
    const user = await (0, user_service_1.validatePassword)(req.body);
    if (!user) {
        return res.status(401).send("Invalid email or password");
    }
    const session = await (0, session_service_1.createSession)(user._id.toString(), req.get("user-agent") || "");
    const accessTokenTtl = config_1.default.has("accessTokenTtl") ? config_1.default.get("accessTokenTtl") : "15m";
    const refreshTokenTtl = config_1.default.has("refreshTokenTtl") ? config_1.default.get("refreshTokenTtl") : "1y";
    const accessToken = (0, jwt_utils_1.signJwt)({ ...user, session: session._id }, "accessTokenPrivateKey", { expiresIn: accessTokenTtl });
    const refreshToken = (0, jwt_utils_1.signJwt)({ ...user, session: session._id }, "refreshTokenPrivateKey", { expiresIn: refreshTokenTtl });
    return res.send({ accessToken, refreshToken });
}
exports.createUserSessionHandler = createUserSessionHandler;
async function getUserSessionsHandler(req, res) {
    const userId = res.locals.user._id;
    const sessions = await (0, session_service_1.findSessions)({ user: userId, valid: true });
    return res.send(sessions);
}
exports.getUserSessionsHandler = getUserSessionsHandler;
async function deleteSessionHandler(req, res) {
    const sessionId = res.locals.user.session;
    await (0, session_service_1.updateSession)({ _id: sessionId }, { valid: false });
    return res.send({
        accessToken: null,
        refreshToken: null,
    });
}
exports.deleteSessionHandler = deleteSessionHandler;
