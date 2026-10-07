"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const session_controller_1 = require("./session.controller");
const validateResource_1 = __importDefault(require("../../middleware/validation/validateResource"));
const requireUser_1 = __importDefault(require("../../middleware/auth/requireUser"));
const session_schema_1 = require("./session.schema");
const rateLimiter_middleware_1 = require("../../middleware/rateLimiter.middleware");
const router = (0, express_1.Router)();
router.post("/", rateLimiter_middleware_1.authRateLimiter, (0, validateResource_1.default)(session_schema_1.createSessionSchema), session_controller_1.createUserSessionHandler);
router.get("/", requireUser_1.default, session_controller_1.getUserSessionsHandler);
router.delete("/", requireUser_1.default, session_controller_1.deleteSessionHandler);
exports.default = router;
