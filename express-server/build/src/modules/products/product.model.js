"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductModel = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const nanoid_1 = require("nanoid");
const productSchema = new mongoose_1.default.Schema({
    productId: {
        type: String,
        required: true,
        unique: true,
        default: () => `product_${(0, nanoid_1.nanoid)(10)}`,
    },
    user: { type: mongoose_1.default.Schema.Types.ObjectId, ref: "User" },
    userId: { type: String },
    title: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    image: { type: String, required: true },
}, {
    timestamps: true,
});
exports.ProductModel = mongoose_1.default.model("Product", productSchema);
exports.default = exports.ProductModel;
