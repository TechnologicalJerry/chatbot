"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var session_controller_1 = require("./session.controller");
var validateResource_1 = __importDefault(require("../../middleware/validation/validateResource"));
var requireUser_1 = __importDefault(require("../../middleware/auth/requireUser"));
var session_schema_1 = require("./session.schema");
var router = (0, express_1.Router)();
/**
 * @openapi
 * '/api/sessions':
 *  post:
 *    tags:
 *    - Session
 *    summary: Create a session
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/CreateSessionInput'
 *    responses:
 *      200:
 *        description: Session created
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/CreateSessionResponse'
 *      401:
 *        description: Unauthorized
 *  get:
 *    tags:
 *    - Session
 *    summary: Get all sessions
 *    responses:
 *      200:
 *        description: Get all sessions for current user
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/GetSessionResponse'
 *      403:
 *        description: Forbidden
 *  delete:
 *    tags:
 *    - Session
 *    summary: Delete a session
 *    responses:
 *      200:
 *        description: Session deleted
 *      403:
 *        description: Forbidden
 */
var rateLimiter_middleware_1 = require("../../middleware/rateLimiter.middleware");
router.post("/", rateLimiter_middleware_1.authRateLimiter, (0, validateResource_1.default)(session_schema_1.createSessionSchema), session_controller_1.createUserSessionHandler);
router.get("/", requireUser_1.default, session_controller_1.getUserSessionsHandler);
router.delete("/", requireUser_1.default, session_controller_1.deleteSessionHandler);
exports.default = router;
