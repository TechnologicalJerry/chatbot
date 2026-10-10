"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.configureRoutes = void 0;
const v1_1 = __importDefault(require("./v1"));
const user_routes_1 = __importDefault(require("../modules/users/user.routes"));
const auth_routes_1 = __importDefault(require("../modules/auth/auth.routes"));
const product_routes_1 = __importDefault(require("../modules/products/product.routes"));
const health_routes_1 = __importDefault(require("./health.routes"));
function configureRoutes(app) {
    // Health & Liveness probes
    app.use("/", health_routes_1.default);
    app.use("/health", health_routes_1.default);
    // Versioned v1 API routes
    app.use("/api/v1", v1_1.default);
    // Legacy direct endpoints for 100% backward compatibility
    app.use("/api/users", user_routes_1.default);
    app.use("/api/sessions", auth_routes_1.default);
    app.use("/api/products", product_routes_1.default);
}
exports.configureRoutes = configureRoutes;
exports.default = configureRoutes;
