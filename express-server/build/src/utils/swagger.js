"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
var swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
var package_json_1 = require("../../package.json");
var logger_1 = __importDefault(require("./logger"));
var options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Conversational AI & REST API Docs",
            version: package_json_1.version,
        },
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT",
                },
            },
        },
        security: [
            {
                bearerAuth: [],
            },
        ],
    },
    apis: [
        "./src/routes.ts",
        "./src/routes/**/*.ts",
        "./src/modules/**/*.ts",
        "./src/schema/*.ts",
    ],
};
var swaggerSpec = (0, swagger_jsdoc_1.default)(options);
function swaggerDocs(app, port) {
    // Swagger page
    app.use("/docs", swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swaggerSpec));
    // Docs in JSON format
    app.get("/docs.json", function (req, res) {
        res.setHeader("Content-Type", "application/json");
        res.send(swaggerSpec);
    });
    logger_1.default.info("Docs available at http://localhost:".concat(port, "/docs"));
}
exports.default = swaggerDocs;
