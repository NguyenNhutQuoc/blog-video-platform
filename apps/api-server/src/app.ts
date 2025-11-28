/**
 * Express Application Setup
 */

import express, { type Express } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import type { Env } from './config/env.js';
import { createSwaggerSpec } from './config/swagger.js';
import {
  errorHandler,
  notFoundHandler,
} from './middleware/error.middleware.js';
import { createAuthMiddleware } from './middleware/auth.middleware.js';
import {
  createHttpLogger,
  createLoggerConfig,
} from './middleware/logger.middleware.js';
import { createAuthRoutes } from './routes/auth.routes.js';
import type {
  IUserRepository,
  ISessionRepository,
  ITokenGenerator,
  IPasswordHasher,
} from '@blog/backend/core';

export interface AppDependencies {
  env: Env;
  userRepository: IUserRepository;
  sessionRepository: ISessionRepository;
  tokenGenerator: ITokenGenerator;
  passwordHasher: IPasswordHasher;
}

export function createApp(deps: AppDependencies): Express {
  const app = express();
  const isProduction = deps.env.NODE_ENV === 'production';

  // HTTP Request Logger (first middleware to capture all requests)
  const loggerConfig = createLoggerConfig({
    NODE_ENV: deps.env.NODE_ENV,
    LOG_LEVEL: deps.env.LOG_LEVEL,
  });
  app.use(createHttpLogger(loggerConfig));

  // Security middleware
  app.use(helmet());

  // CORS
  app.use(
    cors({
      origin: deps.env.CORS_ORIGIN.split(','),
      credentials: true,
    })
  );

  // Compression
  app.use(compression());

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Rate limiting
  app.use(
    rateLimit({
      windowMs: deps.env.RATE_LIMIT_WINDOW_MS,
      max: deps.env.RATE_LIMIT_MAX,
      message: {
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests, please try again later',
        },
      },
    })
  );

  // Trust proxy (for correct IP address behind reverse proxy)
  app.set('trust proxy', 1);

  // Swagger API Documentation (hidden in production)
  if (!isProduction) {
    const swaggerSpec = createSwaggerSpec({
      basePath: `http://${deps.env.HOST}:${deps.env.PORT}`,
    });
    app.use(
      '/api-docs',
      swaggerUi.serve,
      swaggerUi.setup(swaggerSpec, {
        customCss: '.swagger-ui .topbar { display: none }',
        customSiteTitle: 'Blog Video Platform API Docs',
      })
    );

    // Expose swagger spec as JSON
    app.get('/api-docs.json', (_req, res) => {
      res.setHeader('Content-Type', 'application/json');
      res.send(swaggerSpec);
    });
  }

  /**
   * @openapi
   * /health:
   *   get:
   *     summary: Health check endpoint
   *     tags: [Health]
   *     responses:
   *       200:
   *         description: Server is healthy
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: object
   *                   properties:
   *                     status:
   *                       type: string
   *                       example: ok
   *                     timestamp:
   *                       type: string
   *                       format: date-time
   */
  // Health check endpoint
  app.get('/health', (_req, res) => {
    res.json({
      success: true,
      data: {
        status: 'ok',
        timestamp: new Date().toISOString(),
      },
    });
  });

  // Auth middleware factory
  const authMiddleware = createAuthMiddleware({
    tokenGenerator: deps.tokenGenerator,
  });

  // API Routes
  const authRoutes = createAuthRoutes({
    userRepository: deps.userRepository,
    sessionRepository: deps.sessionRepository,
    passwordHasher: deps.passwordHasher,
    tokenGenerator: deps.tokenGenerator,
    authMiddleware,
  });

  app.use('/api/auth', authRoutes);

  // 404 handler
  app.use(notFoundHandler);

  // Error handler
  app.use(errorHandler);

  return app;
}
