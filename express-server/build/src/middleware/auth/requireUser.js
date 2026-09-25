"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireUser = void 0;
var requireUser = function (req, res, next) {
    var user = res.locals.user;
    if (!user) {
        return res.sendStatus(403);
    }
    return next();
};
exports.requireUser = requireUser;
exports.default = requireUser;
