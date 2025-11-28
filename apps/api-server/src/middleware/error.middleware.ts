/**
 * Error Handler Middleware
 *
 * Global error handling for Express.
 */

/* eslint-disable @typescript-eslint/no-unused-vars */
import type {
  Request,
  Response,
  NextFunction,
  ErrorRequestHandler,
} from 'express';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
  details?: Record<string, unknown>;
}

// Note: Express error handlers require 4 parameters
export const errorHandler: ErrorRequestHandler = (
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const statusCode = err.statusCode ?? 500;
  const code = err.code ?? 'INTERNAL_ERROR';
  const message = err.message ?? 'An unexpected error occurred';

  console.error(`[ERROR] ${code}: ${message}`, err.stack);

  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message:
        process.env['NODE_ENV'] === 'production' && statusCode === 500
          ? 'An unexpected error occurred'
          : message,
      ...(err.details && { details: err.details }),
    },
  });
};

/**
 * Not Found Handler
 */
export const notFoundHandler = (
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
    },
  });
};

/**
 * Create an AppError
 */
export function createError(
  message: string,
  statusCode = 500,
  code = 'INTERNAL_ERROR',
  details?: Record<string, unknown>
): AppError {
  const error: AppError = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  error.details = details;
  return error;
}

/**
 * Async handler wrapper
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
