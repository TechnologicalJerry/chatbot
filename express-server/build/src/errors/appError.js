"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppError = void 0;
class AppError extends Error {
    statusCode;
    isOperational;
    details;
    constructor(message, statusCode = 500, details) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        this.details = details;
        Object.setPrototypeOf(this, AppError.prototype);
    }
    static notFound(message = "Resource not found") {
        return new AppError(message, 404);
    }
    static badRequest(message = "Bad request", details) {
        return new AppError(message, 400, details);
    }
    static unauthorized(message = "Unauthorized") {
        return new AppError(message, 401);
    }
    static forbidden(message = "Forbidden") {
        return new AppError(message, 403);
    }
    static conflict(message = "Conflict") {
        return new AppError(message, 409);
    }
    static internal(message = "Internal server error") {
        return new AppError(message, 500);
    }
    static validationError(message = "Validation failed", details) {
        return new AppError(message, 400, details);
    }
}
exports.AppError = AppError;
exports.default = AppError;
