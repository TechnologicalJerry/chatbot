"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchProductsTool = void 0;
const zod_1 = require("zod");
const product_model_1 = __importDefault(require("../../../../modules/products/product.model"));
class SearchProductsTool {
    name = "search_products";
    description = "Search catalog products by query string with bounded results.";
    inputSchema = zod_1.z.object({
        query: zod_1.z.string().min(1).max(100),
        limit: zod_1.z.number().min(1).max(5).default(5),
    });
    async execute(args, context) {
        const validated = this.inputSchema.parse(args);
        const limit = Math.min(validated.limit || 5, 5);
        const regex = new RegExp(validated.query, "i");
        const products = await product_model_1.default.find({
            $or: [{ title: regex }, { description: regex }],
        })
            .limit(limit)
            .lean();
        return products.map((p) => ({
            productId: p.productId || p._id,
            title: p.title,
            price: p.price,
            description: p.description?.substring(0, 150),
        }));
    }
}
exports.SearchProductsTool = SearchProductsTool;
exports.default = SearchProductsTool;
