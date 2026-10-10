"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.swaggerDocs = void 0;
function swaggerDocs(app, port) {
    app.get("/docs.json", (req, res) => {
        res.setHeader("Content-Type", "application/json");
        res.send({ openapi: "3.0.0", info: { title: "Chatbot API", version: "1.0.0" } });
    });
}
exports.swaggerDocs = swaggerDocs;
exports.default = swaggerDocs;
