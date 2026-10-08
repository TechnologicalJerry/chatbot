"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetUserProfileTool = void 0;
const zod_1 = require("zod");
const user_model_1 = __importDefault(require("../../../../modules/users/user.model"));
class GetUserProfileTool {
    name = "get_user_profile";
    description = "Get authenticated user profile details (read-only).";
    inputSchema = zod_1.z.object({});
    async execute(args, context) {
        const user = await user_model_1.default.findById(context.userId).lean();
        if (!user) {
            return { error: "User profile not found" };
        }
        // Sanitize user output - exclude sensitive security fields
        return {
            userId: user._id,
            email: user.email,
            name: user.name,
            createdAt: user.createdAt,
        };
    }
}
exports.GetUserProfileTool = GetUserProfileTool;
exports.default = GetUserProfileTool;
