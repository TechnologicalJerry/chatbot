"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.configureRoutes = void 0;
var index_1 = require("./routes/index");
Object.defineProperty(exports, "configureRoutes", { enumerable: true, get: function () { return index_1.configureRoutes; } });
function routes(app) {
    (0, index_1.configureRoutes)(app);
}
exports.default = routes;
