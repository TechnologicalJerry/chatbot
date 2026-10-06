export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  public details?: any;

  constructor(message: string, statusCode = 500, details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.details = details;
    Object.setPrototypeOf(this, AppError.prototype);
  }

  static notFound(message = "Resource not found"): AppError {
    return new AppError(message, 404);
  }

  static badRequest(message = "Bad request", details?: any): AppError {
    return new AppError(message, 400, details);
  }

  static unauthorized(message = "Unauthorized"): AppError {
    return new AppError(message, 401);
  }

  static forbidden(message = "Forbidden"): AppError {
    return new AppError(message, 403);
  }

  static conflict(message = "Conflict"): AppError {
    return new AppError(message, 409);
  }

  static internal(message = "Internal server error"): AppError {
    return new AppError(message, 500);
  }

  static validationError(message = "Validation failed", details?: any): AppError {
    return new AppError(message, 400, details);
  }
}

export default AppError;
