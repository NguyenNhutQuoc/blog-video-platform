/**
 * Rate Limiting Middleware
 *
 * Provides stricter rate limiting for auth endpoints to prevent brute force attacks.
 * Also provides Redis-based rate limiting for comments (50 per day per user).
 */

import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import type { Request, Response, NextFunction } from 'express';
import { Redis } from 'ioredis';

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
  windowMs: 1 * 60 * 1000, // 1 minute
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
    keyGenerator: (req: Request) =>
      `resend-verification:${normalizeClientIp(req)}`,
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

// ============================================================================
// Redis-based Comment Rate Limiter (50 comments per day per user)
// ============================================================================

export interface CommentRateLimitConfig {
  /** Redis connection options */
  redis: {
    host: string;
    port: number;
    password?: string;
  };
  /** Max comments per day (default: 50) */
  maxCommentsPerDay?: number;
}

// Use type instead of interface to avoid extending Request
type CommentRateLimitRequest = Request & {
  incrementCommentCount?: () => Promise<void>;
};

let redisClient: Redis | null = null;

/**
 * Creates a Redis-based rate limiter for comments
 * Limits: 50 comments per day per authenticated user
 *
 * Uses Redis INCR with daily key expiry for efficient tracking.
 * Key format: comment-rate:{userId}:{YYYY-MM-DD}
 */
export function createCommentRateLimiter(config: CommentRateLimitConfig) {
  const maxCommentsPerDay = config.maxCommentsPerDay ?? 50;

  // Lazy initialize Redis client
  const getRedis = (): Redis => {
    if (!redisClient) {
      redisClient = new Redis({
        host: config.redis.host,
        port: config.redis.port,
        password: config.redis.password,
        maxRetriesPerRequest: 3,
        lazyConnect: true,
      });

      redisClient.on('error', (err) => {
        console.error('Comment rate limiter Redis error:', err);
      });
    }
    return redisClient;
  };

  return async (
    req: CommentRateLimitRequest,
    res: Response,
    next: NextFunction
  ) => {
    // Access user from req.user which is set by auth middleware
    const userId = (req as Request & { user?: { userId: string } }).user
      ?.userId;

    // Skip rate limiting for unauthenticated requests (auth middleware will handle)
    if (!userId) {
      return next();
    }

    // Get today's date in UTC for consistent key
    const today = new Date().toISOString().split('T')[0];
    const key = `comment-rate:${userId}:${today}`;

    try {
      const redis = getRedis();

      // Get current count
      const currentCount = await redis.get(key);
      const count = currentCount ? parseInt(currentCount, 10) : 0;

      if (count >= maxCommentsPerDay) {
        // Calculate seconds until midnight UTC
        const now = new Date();
        const midnight = new Date(now);
        midnight.setUTCHours(24, 0, 0, 0);
        const secondsUntilMidnight = Math.ceil(
          (midnight.getTime() - now.getTime()) / 1000
        );

        return res.status(429).json({
          success: false,
          error: {
            code: 'COMMENT_RATE_LIMIT_EXCEEDED',
            message: `You have reached the daily limit of ${maxCommentsPerDay} comments. Please try again tomorrow.`,
            retryAfter: secondsUntilMidnight,
            remaining: 0,
            limit: maxCommentsPerDay,
          },
        });
      }

      // Increment count - will be committed after successful comment creation
      // Store the increment function on the request for the route to call
      (req as CommentRateLimitRequest).incrementCommentCount = async () => {
        const multi = redis.multi();
        multi.incr(key);
        // Set expiry to 25 hours to ensure key persists through the day
        multi.expire(key, 25 * 60 * 60);
        await multi.exec();
      };

      // Add rate limit headers
      res.setHeader('X-RateLimit-Limit', maxCommentsPerDay.toString());
      res.setHeader(
        'X-RateLimit-Remaining',
        (maxCommentsPerDay - count).toString()
      );

      next();
    } catch (error) {
      console.error('Comment rate limiter error:', error);
      // Fail open - allow the request if Redis is unavailable
      next();
    }
  };
}

/**
 * Get current comment count for a user (useful for displaying in UI)
 */
export async function getCommentCount(
  redis: Redis,
  userId: string
): Promise<{ count: number; limit: number; remaining: number }> {
  const today = new Date().toISOString().split('T')[0];
  const key = `comment-rate:${userId}:${today}`;

  const currentCount = await redis.get(key);
  const count = currentCount ? parseInt(currentCount, 10) : 0;
  const limit = 50;

  return {
    count,
    limit,
    remaining: Math.max(0, limit - count),
  };
}

/**
 * Cleanup Redis connection on shutdown
 */
export async function closeCommentRateLimiter(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
}
