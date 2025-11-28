/**
 * Logger Middleware
 *
 * HTTP request logging using pino-http.
 * Provides structured JSON logs in production and pretty-printed logs in development.
 */

import { pinoHttp, type HttpLogger } from 'pino-http';
import pino from 'pino';
import type { Request, Response } from 'express';
import crypto from 'crypto';

export type LogLevel = 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace';

export interface LoggerConfig {
  level: LogLevel;
  enabled: boolean;
  prettyPrint: boolean;
}

/**
 * Generate a unique request ID
 */
function generateRequestId(): string {
  return crypto.randomUUID();
}

/**
 * Create the pino logger instance
 */
export function createLogger(config: LoggerConfig) {
  const transport = config.prettyPrint
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      }
    : undefined;

  return pino({
    level: config.level,
    enabled: config.enabled,
    transport,
  });
}

/**
 * Create HTTP logger middleware
 */
export function createHttpLogger(config: LoggerConfig): HttpLogger {
  const logger = createLogger(config);

  return pinoHttp({
    logger,
    // Generate unique request ID
    genReqId: (req: Request) => {
      // Use existing request ID from header if present (from load balancer/proxy)
      const existingId: string | undefined = req.headers['x-request-id'] as
        | string
        | undefined;
      if (existingId && typeof existingId === 'string') {
        return existingId;
      }
      return generateRequestId();
    },
    // Customize request serializer
    serializers: {
      req: (req: Record<string, unknown>) => ({
        id: req.id,
        method: req.method,
        url: req.url,
        query: req.query,
        // Don't log sensitive headers
        headers: {
          'user-agent': (req.headers as Record<string, string>)?.['user-agent'],
          'content-type': (req.headers as Record<string, string>)?.[
            'content-type'
          ],
          'content-length': (req.headers as Record<string, string>)?.[
            'content-length'
          ],
          host: (req.headers as Record<string, string>)?.host,
        },
      }),
      res: (res: Record<string, unknown>) => ({
        statusCode: res.statusCode,
      }),
    },
    // Customize what gets logged
    customLogLevel: (
      _req: Request,
      res: Response,
      err: Error | undefined
    ): 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace' | 'silent' => {
      if (res.statusCode >= 500 || err) {
        return 'error';
      }
      if (res.statusCode >= 400) {
        return 'warn';
      }
      if (res.statusCode >= 300) {
        return 'silent';
      }
      return 'info';
    },
    // Customize success message
    customSuccessMessage: (req: Request, res: Response): string => {
      return `${req.method} ${req.url} ${res.statusCode}`;
    },
    // Customize error message
    customErrorMessage: (req: Request, res: Response, err: Error): string => {
      return `${req.method} ${req.url} ${res.statusCode} - ${err.message}`;
    },
    // Add custom attributes to each log
    customAttributeKeys: {
      req: 'request',
      res: 'response',
      err: 'error',
      responseTime: 'duration',
    },
    // Quiet down health check logs
    autoLogging: {
      ignore: (req: Request) => {
        // Don't log health check requests
        return (req as Request).url === '/health';
      },
    },
  });
}

/**
 * Create logger configuration from environment
 */
export function createLoggerConfig(env: {
  NODE_ENV: string;
  LOG_LEVEL?: LogLevel;
}): LoggerConfig {
  const isDevelopment = env.NODE_ENV === 'development';
  const isTest = env.NODE_ENV === 'test';

  return {
    level: env.LOG_LEVEL ?? (isDevelopment ? 'debug' : 'info'),
    enabled: !isTest, // Disable logging in tests
    prettyPrint: isDevelopment,
  };
}

// Export the logger type for use in other modules
export type { Logger } from 'pino';
export { pino };
