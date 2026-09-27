"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.configureRoutes = void 0;
var v1_1 = __importDefault(require("./v1"));
var user_routes_1 = __importDefault(require("../modules/users/user.routes"));
var auth_routes_1 = __importDefault(require("../modules/auth/auth.routes"));
var product_routes_1 = __importDefault(require("../modules/products/product.routes"));
var health_routes_1 = __importDefault(require("./health.routes"));
function configureRoutes(app) {
    // Health, Liveness & Readiness routes
    app.use("/", health_routes_1.default);
    app.use("/health", health_routes_1.default);
    // Versioned v1 API routes
    app.use("/api/v1", v1_1.default);
    // Legacy direct API routes (for 100% backward compatibility)
    app.use("/api/users", user_routes_1.default);
    app.use("/api/sessions", auth_routes_1.default);
    app.use("/api/products", product_routes_1.default);
}
exports.configureRoutes = configureRoutes;
exports.default = configureRoutes;
