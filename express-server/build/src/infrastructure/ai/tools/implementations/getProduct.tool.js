"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetProductTool = void 0;
const zod_1 = require("zod");
const product_model_1 = __importDefault(require("../../../../modules/products/product.model"));
class GetProductTool {
    name = "get_product";
    description = "Get detailed information for a specific product by productId.";
    inputSchema = zod_1.z.object({
        productId: zod_1.z.string().min(1),
    });
    async execute(args, context) {
        const validated = this.inputSchema.parse(args);
        const product = await product_model_1.default.findOne({
            $or: [{ productId: validated.productId }, { _id: validated.productId }],
        }).lean();
        if (!product) {
            return { error: "Product not found" };
        }
        return {
            productId: product.productId || product._id,
            title: product.title,
            price: product.price,
            description: product.description,
            image: product.image,
        };
    }
}
exports.GetProductTool = GetProductTool;
exports.default = GetProductTool;
