"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var memory_controller_1 = require("./memory.controller");
var requireUser_1 = __importDefault(require("../../middleware/auth/requireUser"));
var validateResource_1 = __importDefault(require("../../middleware/validation/validateResource"));
var memory_schema_1 = require("./memory.schema");
var router = (0, express_1.Router)();
// Require authentication for memory endpoints
router.use(requireUser_1.default);
/**
 * @openapi
 * /api/v1/memories:
 *   get:
 *     tags:
 *     - Memory
 *     summary: List user's active persistent memories
 *     security:
 *     - bearerAuth: []
 *     parameters:
 *     - name: limit
 *       in: query
 *       schema:
 *         type: integer
 *         default: 20
 *     - name: type
 *       in: query
 *       schema:
 *         type: string
 *         enum: [preference, profile, goal, constraint, fact]
 *     responses:
 *       200:
 *         description: List of active user memories
 *       403:
 *         description: Unauthorized
 */
router.get("/", (0, validateResource_1.default)(memory_schema_1.getMemoriesSchema), memory_controller_1.getMemoriesHandler);
/**
 * @openapi
 * /api/v1/memories/{memoryId}:
 *   delete:
 *     tags:
 *     - Memory
 *     summary: Soft-delete a user memory item
 *     security:
 *     - bearerAuth: []
 *     parameters:
 *     - name: memoryId
 *       in: path
 *       required: true
 *       schema:
 *         type: string
 *     responses:
 *       200:
 *         description: Memory deleted successfully
 *       403:
 *         description: Unauthorized
 *       404:
 *         description: Memory item not found
 */
router.delete("/:memoryId", (0, validateResource_1.default)(memory_schema_1.deleteMemorySchema), memory_controller_1.deleteMemoryHandler);
exports.default = router;
