/**
 * Rate Limiting Middleware
 *
 * Provides stricter rate limiting for auth endpoints to prevent brute force attacks.
 */

import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import type { Request, Response } from 'express';

/**
 * Normalize IP addresses (including IPv6) using the helper provided by express-rate-limit
 */
function normalizeClientIp(req: Request): string {
  return ipKeyGenerator(req.ip ?? '0.0.0.0');
}

/**
 * Rate limit configuration for auth endpoints
 */
export interface AuthRateLimitConfig {
  /** Window in milliseconds (default: 15 minutes) */
  windowMs?: number;
  /** Max requests per window for login (default: 5) */
  loginMax?: number;
  /** Max requests per window for register (default: 3) */
  registerMax?: number;
  /** Max requests per window for password reset (default: 3) */
  passwordResetMax?: number;
  /** Skip successful requests (default: false) */
  skipSuccessfulRequests?: boolean;
}

const defaultConfig: Required<AuthRateLimitConfig> = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  loginMax: 5,
  registerMax: 3,
  passwordResetMax: 3,
  skipSuccessfulRequests: false,
};

/**
 * Creates a rate limiter for login endpoint
 * Limits: 5 attempts per 15 minutes per IP
 */
export function createLoginRateLimiter(config: AuthRateLimitConfig = {}) {
  const { windowMs, loginMax, skipSuccessfulRequests } = {
    ...defaultConfig,
    ...config,
  };

  return rateLimit({
    windowMs,
    max: loginMax,
    skipSuccessfulRequests,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: Request) => {
      // Use IP + email for more granular limiting
      const email = req.body?.email?.toLowerCase() || '';
      return `login:${normalizeClientIp(req)}:${email}`;
    },
    handler: (_req: Request, res: Response) => {
      res.status(429).json({
        success: false,
        error: {
          code: 'TOO_MANY_LOGIN_ATTEMPTS',
          message:
            'Too many login attempts. Please try again after 15 minutes.',
          retryAfter: Math.ceil(windowMs / 1000),
        },
      });
    },
  });
}

/**
 * Creates a rate limiter for register endpoint
 * Limits: 3 attempts per 15 minutes per IP
 */
export function createRegisterRateLimiter(config: AuthRateLimitConfig = {}) {
  const { windowMs, registerMax } = { ...defaultConfig, ...config };

  return rateLimit({
    windowMs,
    max: registerMax,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: Request) => `register:${normalizeClientIp(req)}`,
    handler: (_req: Request, res: Response) => {
      res.status(429).json({
        success: false,
        error: {
          code: 'TOO_MANY_REGISTER_ATTEMPTS',
          message:
            'Too many registration attempts. Please try again after 15 minutes.',
          retryAfter: Math.ceil(windowMs / 1000),
        },
      });
    },
  });
}

/**
 * Creates a rate limiter for password reset endpoints
 * Limits: 3 attempts per 15 minutes per IP
 */
export function createPasswordResetRateLimiter(
  config: AuthRateLimitConfig = {}
) {
  const { windowMs, passwordResetMax } = { ...defaultConfig, ...config };

  return rateLimit({
    windowMs,
    max: passwordResetMax,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: Request) => {
      const email = req.body?.email?.toLowerCase() || '';
      return `password-reset:${normalizeClientIp(req)}:${email}`;
    },
    handler: (_req: Request, res: Response) => {
      res.status(429).json({
        success: false,
        error: {
          code: 'TOO_MANY_RESET_ATTEMPTS',
          message:
            'Too many password reset attempts. Please try again after 15 minutes.',
          retryAfter: Math.ceil(windowMs / 1000),
        },
      });
    },
  });
}

/**
 * Creates a rate limiter for email verification resend
 * Limits: 3 attempts per 15 minutes per IP
 */
export function createResendVerificationRateLimiter(
  config: AuthRateLimitConfig = {}
) {
  const { windowMs, passwordResetMax } = { ...defaultConfig, ...config };

  return rateLimit({
    windowMs,
    max: passwordResetMax,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: Request) => `resend-verification:${normalizeClientIp(req)}`,
    handler: (_req: Request, res: Response) => {
      res.status(429).json({
        success: false,
        error: {
          code: 'TOO_MANY_RESEND_ATTEMPTS',
          message:
            'Too many verification email requests. Please try again after 15 minutes.',
          retryAfter: Math.ceil(windowMs / 1000),
        },
      });
    },
  });
}
