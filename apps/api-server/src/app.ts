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
import {
  createAuthMiddleware,
  createOptionalAuthMiddleware,
} from './middleware/auth.middleware.js';
import {
  createHttpLogger,
  createLoggerConfig,
} from './middleware/logger.middleware.js';
import { createAuthRoutes } from './routes/auth.routes.js';
import { createPostsRoutes } from './routes/posts.routes.js';
import { createUsersRoutes } from './routes/users.routes.js';
import { createFollowsRoutes } from './routes/follows.routes.js';
import { createCategoriesRoutes } from './routes/categories.routes.js';
import { createTagsRoutes } from './routes/tags.routes.js';
import { createVideosRoutes } from './routes/videos.routes.js';
import { createCommentsRoutes } from './routes/comments.routes.js';
import { createBookmarksRoutes } from './routes/bookmarks.routes.js';
import type {
  IBookmarkRepository,
  IBookmarkFolderRepository,
} from '@blog/backend/core';
import type {
  IUserRepository,
  IPostRepository,
  ISessionRepository,
  ICategoryRepository,
  ITagRepository,
  IFollowRepository,
  ILikeRepository,
  ICommentRepository,
  ICommentLikeRepository,
  IVideoRepository,
  IVideoQualityRepository,
  ITokenGenerator,
  IPasswordHasher,
  IEmailVerificationTokenRepository,
  IPasswordResetTokenRepository,
  IEmailService,
  IStorageService,
  IVideoQueueService,
} from '@blog/backend/core';

export interface AppDependencies {
  env: Env;
  userRepository: IUserRepository;
  postRepository: IPostRepository;
  sessionRepository: ISessionRepository;
  categoryRepository: ICategoryRepository;
  tagRepository: ITagRepository;
  followRepository: IFollowRepository;
  likeRepository: ILikeRepository;
  commentRepository: ICommentRepository;
  commentLikeRepository: ICommentLikeRepository;
  bookmarkRepository: IBookmarkRepository;
  bookmarkFolderRepository: IBookmarkFolderRepository;
  videoRepository: IVideoRepository;
  videoQualityRepository?: IVideoQualityRepository;
  tokenGenerator: ITokenGenerator;
  passwordHasher: IPasswordHasher;
  // Optional dependencies
  emailVerificationTokenRepository?: IEmailVerificationTokenRepository;
  passwordResetTokenRepository?: IPasswordResetTokenRepository;
  emailService?: IEmailService;
  storageService?: IStorageService;
  videoQueueService?: IVideoQueueService;
  queueVideoForProcessing?: (
    videoId: string,
    rawFilePath: string
  ) => Promise<string>;
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

  console.log('CORS_ORIGIN:', deps.env.CORS_ORIGIN);

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

  const optionalAuthMiddleware = createOptionalAuthMiddleware({
    tokenGenerator: deps.tokenGenerator,
  });

  // API Routes
  const authRoutes = createAuthRoutes({
    userRepository: deps.userRepository,
    sessionRepository: deps.sessionRepository,
    passwordHasher: deps.passwordHasher,
    tokenGenerator: deps.tokenGenerator,
    authMiddleware,
    emailVerificationTokenRepository: deps.emailVerificationTokenRepository,
    passwordResetTokenRepository: deps.passwordResetTokenRepository,
    emailService: deps.emailService,
    appUrl: deps.env.APP_URL,
  });

  const postsRoutes = createPostsRoutes({
    postRepository: deps.postRepository,
    userRepository: deps.userRepository,
    categoryRepository: deps.categoryRepository,
    tagRepository: deps.tagRepository,
    likeRepository: deps.likeRepository,
    bookmarkRepository: deps.bookmarkRepository,
    authMiddleware,
    optionalAuthMiddleware,
  });

  const commentsRoutes = createCommentsRoutes({
    commentRepository: deps.commentRepository,
    commentLikeRepository: deps.commentLikeRepository,
    postRepository: deps.postRepository,
    userRepository: deps.userRepository,
    authMiddleware,
    optionalAuthMiddleware,
    redisConfig: {
      host: deps.env.REDIS_HOST,
      port: deps.env.REDIS_PORT,
      password: deps.env.REDIS_PASSWORD,
    },
  });

  const usersRoutes = createUsersRoutes({
    userRepository: deps.userRepository,
    postRepository: deps.postRepository,
    followRepository: deps.followRepository,
    authMiddleware,
    optionalAuthMiddleware,
  });

  const followsRoutes = createFollowsRoutes({
    followRepository: deps.followRepository,
    userRepository: deps.userRepository,
    authMiddleware,
    optionalAuthMiddleware,
  });

  const categoriesRoutes = createCategoriesRoutes({
    categoryRepository: deps.categoryRepository,
  });

  const tagsRoutes = createTagsRoutes({
    tagRepository: deps.tagRepository,
    authMiddleware,
  });

  const bookmarksRoutes = createBookmarksRoutes({
    bookmarkRepository: deps.bookmarkRepository,
    bookmarkFolderRepository: deps.bookmarkFolderRepository,
    postRepository: deps.postRepository,
    userRepository: deps.userRepository,
    authMiddleware,
  });

  // Video routes (only if storage service is configured)
  const videosRoutes =
    deps.storageService &&
    deps.queueVideoForProcessing &&
    deps.videoQueueService &&
    deps.videoQualityRepository
      ? createVideosRoutes({
          videoRepository: deps.videoRepository,
          videoQualityRepository: deps.videoQualityRepository,
          userRepository: deps.userRepository,
          storageService: deps.storageService,
          videoQueueService: deps.videoQueueService,
          authMiddleware,
          queueVideoForProcessing: deps.queueVideoForProcessing,
        })
      : null;

  // Log các thông tin khởi động liên quan đến video routes
  console.log('🎬 Setting up video routes...');
  console.log(`  Storage Service Configured: ${!!deps.storageService}`);
  console.log(
    `  Queue Video For Processing Function Provided: ${!!deps.queueVideoForProcessing}`
  );
  console.log(`  Video Queue Service Configured: ${!!deps.videoQueueService}`);
  console.log(
    `  Video Quality Repository Configured: ${!!deps.videoQualityRepository}`
  );

  // Log the availability of video routes
  if (videosRoutes) {
    console.log('🎬 Video routes enabled');
  } else {
    console.log('🎬 Video routes disabled (storage service not configured)');
  }

  app.use('/api/auth', authRoutes);
  app.use('/api/posts', postsRoutes);
  // Comments routes mounted under /api for /posts/:postId/comments and /comments/:id
  app.use('/api', commentsRoutes);
  app.use('/api/users', usersRoutes);
  // Mount follows routes under /api/users for follow/unfollow endpoints
  app.use('/api/users', followsRoutes);
  app.use('/api/categories', categoriesRoutes);
  app.use('/api/tags', tagsRoutes);
  // Mount bookmarks routes under /api for bookmarks endpoints
  app.use('/api', bookmarksRoutes);

  // Mount video routes if configured
  if (videosRoutes) {
    app.use('/api/videos', videosRoutes);
  }

  // 404 handler
  app.use(notFoundHandler);

  // Error handler
  app.use(errorHandler);

  return app;
}
