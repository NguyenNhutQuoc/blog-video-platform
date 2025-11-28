/**
 * Base Use Case Result Types
 *
 * Standard result types for use case outputs.
 */

/**
 * Success result
 */
export type Success<T> = {
  success: true;
  data: T;
};

/**
 * Error result
 */
export type Failure = {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
};

/**
 * Result type for use cases
 */
export type Result<T> = Success<T> | Failure;

/**
 * Create a success result
 */
export function success<T>(data: T): Success<T> {
  return { success: true, data };
}

/**
 * Create a failure result
 */
export function failure(
  code: string,
  message: string,
  details?: Record<string, unknown>
): Failure {
  return {
    success: false,
    error: { code, message, details },
  };
}

/**
 * Common error codes
 */
export const ErrorCodes = {
  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',

  // Auth
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  EMAIL_ALREADY_EXISTS: 'EMAIL_ALREADY_EXISTS',
  USERNAME_ALREADY_EXISTS: 'USERNAME_ALREADY_EXISTS',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  USER_INACTIVE: 'USER_INACTIVE',
  SESSION_NOT_FOUND: 'SESSION_NOT_FOUND',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  INVALID_TOKEN: 'INVALID_TOKEN',

  // Posts
  POST_NOT_FOUND: 'POST_NOT_FOUND',
  UNAUTHORIZED_TO_EDIT: 'UNAUTHORIZED_TO_EDIT',
  CANNOT_CREATE_POST: 'CANNOT_CREATE_POST',

  // Videos
  VIDEO_NOT_FOUND: 'VIDEO_NOT_FOUND',
  VIDEO_PROCESSING_FAILED: 'VIDEO_PROCESSING_FAILED',

  // General
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
} as const;
