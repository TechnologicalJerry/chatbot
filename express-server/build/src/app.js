"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const requestId_1 = __importDefault(require("./middleware/request-context/requestId"));
const deserializeUser_1 = __importDefault(require("./middleware/auth/deserializeUser"));
const index_1 = __importDefault(require("./routes/index"));
const logger_1 = __importDefault(require("./infrastructure/logger/logger"));
const constants_1 = require("./config/constants");
function createApp() {
    const app = (0, express_1.default)();
    app.use((0, cors_1.default)());
    app.use((0, helmet_1.default)({ contentSecurityPolicy: false }));
    app.use(express_1.default.json());
    app.use(express_1.default.urlencoded({ extended: true }));
    app.use(requestId_1.default);
    app.use(deserializeUser_1.default);
    (0, index_1.default)(app);
    // Global Error Handler
    app.use((err, req, res, next) => {
        const requestId = req.id || req.headers[constants_1.HEADER_REQUEST_ID];
        const statusCode = err.statusCode || (err.status && typeof err.status === 'number' ? err.status : 500);
        const message = err.message || "Internal server error";
        if (statusCode >= 500) {
            logger_1.default.error({ err, requestId }, "Unhandled application error");
        }
        return res.status(statusCode).json({
            success: false,
            error: {
                message,
                ...(err.details ? { details: err.details } : {}),
            },
            requestId,
        });
    });
    return app;
}
exports.createApp = createApp;
exports.default = createApp;
