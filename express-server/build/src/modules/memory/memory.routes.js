"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const memory_controller_1 = require("./memory.controller");
const requireUser_1 = __importDefault(require("../../middleware/auth/requireUser"));
const validateResource_1 = __importDefault(require("../../middleware/validation/validateResource"));
const memory_schema_1 = require("./memory.schema");
const router = (0, express_1.Router)();
router.use(requireUser_1.default);
router.get("/", memory_controller_1.listMemoriesHandler);
router.post("/", (0, validateResource_1.default)(memory_schema_1.createMemorySchema), memory_controller_1.createMemoryHandler);
router.delete("/:memoryId", (0, validateResource_1.default)(memory_schema_1.deleteMemorySchema), memory_controller_1.deleteMemoryHandler);
exports.default = router;
