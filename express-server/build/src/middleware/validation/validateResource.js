"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateResource = void 0;
const zod_1 = require("zod");
const appError_1 = require("../../errors/appError");
const validateResource = (schema) => {
    return (req, res, next) => {
        try {
            schema.parse({
                body: req.body,
                query: req.query,
                params: req.params,
            });
            next();
        }
        catch (e) {
            if (e instanceof zod_1.ZodError) {
                return next(appError_1.AppError.validationError("Validation failed", e.errors));
            }
            return res.status(400).send(e.errors || e.message);
        }
    };
};
exports.validateResource = validateResource;
exports.default = exports.validateResource;
