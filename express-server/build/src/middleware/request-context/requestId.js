"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestIdMiddleware = void 0;
var nanoid_1 = require("nanoid");
var constants_1 = require("../../config/constants");
function requestIdMiddleware(req, res, next) {
    var existingId = req.headers[constants_1.HEADER_REQUEST_ID];
    var requestId = existingId || "req_".concat((0, nanoid_1.nanoid)(12));
    req.headers[constants_1.HEADER_REQUEST_ID] = requestId;
    res.setHeader(constants_1.HEADER_REQUEST_ID, requestId);
    req.id = requestId;
    next();
}
exports.requestIdMiddleware = requestIdMiddleware;
