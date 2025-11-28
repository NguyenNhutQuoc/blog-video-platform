/**
 * Authentication Middleware
 *
 * Validates JWT tokens and attaches user info to request.
 */

import type { Request, Response, NextFunction } from 'express';
import type { ITokenGenerator, TokenPayload } from '@blog/backend/core';
import { createError } from './error.middleware.js';

// Extend Express Request type
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

export interface AuthMiddlewareOptions {
  tokenGenerator: ITokenGenerator;
  optional?: boolean;
}

/**
 * Create authentication middleware
 */
export function createAuthMiddleware(options: AuthMiddlewareOptions) {
  const { tokenGenerator, optional = false } = options;

  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      // Get token from Authorization header
      const authHeader = req.headers.authorization;

      if (!authHeader) {
        if (optional) {
          return next();
        }
        throw createError('No authorization header', 401, 'UNAUTHORIZED');
      }

      // Check Bearer format
      const [scheme, token] = authHeader.split(' ');

      if (scheme !== 'Bearer' || !token) {
        throw createError(
          'Invalid authorization format. Use: Bearer <token>',
          401,
          'UNAUTHORIZED'
        );
      }

      // Verify token
      const payload = await tokenGenerator.verifyAccessToken(token);

      if (!payload) {
        throw createError('Invalid or expired token', 401, 'INVALID_TOKEN');
      }

      // Attach user to request
      req.user = payload;

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Require admin role
 */
export function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  if (!req.user) {
    return next(createError('Authentication required', 401, 'UNAUTHORIZED'));
  }

  if (!req.user.isAdmin) {
    return next(createError('Admin access required', 403, 'FORBIDDEN'));
  }

  next();
}
