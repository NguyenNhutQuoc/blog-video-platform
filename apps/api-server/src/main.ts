/**
 * API Server Entry Point
 */

import { loadEnv } from './config/env.js';
import { createApp } from './app.js';
import { createContainer } from './container.js';
import {
  getDatabase,
  getPool,
  createPasswordHasher,
  createTokenGenerator,
  createMinIOService,
  createVideoQueueService,
} from '@blog/backend/infrastructure';

async function main() {
  try {
    // Load environment
    const env = loadEnv();
    console.log(`🚀 Starting API Server in ${env.NODE_ENV} mode...`);

    // Initialize database
    console.log('📦 Connecting to database...');
    const db = getDatabase({
      host: env.DATABASE_HOST,
      port: env.DATABASE_PORT,
      database: env.DATABASE_NAME,
      user: env.DATABASE_USER,
      password: env.DATABASE_PASSWORD,
    });

    const pool = getPool();
    if (!pool) {
      throw new Error('Database pool not initialized');
    }

    // Verify database connection

    // Initialize services
    const passwordHasher = createPasswordHasher();
    const tokenGenerator = createTokenGenerator({
      accessTokenSecret: env.JWT_ACCESS_SECRET ?? env.JWT_SECRET,
      refreshTokenSecret: env.JWT_REFRESH_SECRET ?? env.JWT_SECRET + '-refresh',
    });

    // Initialize MinIO storage service
    let storageService:
      | Awaited<ReturnType<typeof createMinIOService>>
      | undefined;
    let videoQueueService:
      | ReturnType<typeof createVideoQueueService>
      | undefined;
    let queueVideoForProcessing:
      | ((videoId: string, rawFilePath: string) => Promise<string>)
      | undefined;

    try {
      storageService = await createMinIOService({
        endPoint: env.MINIO_ENDPOINT,
        port: env.MINIO_PORT,
        useSSL: env.MINIO_USE_SSL,
        accessKey: env.MINIO_ACCESS_KEY,
        secretKey: env.MINIO_SECRET_KEY,
        publicUrl: env.MINIO_PUBLIC_URL,
      });
      console.log('📦 MinIO storage service initialized');

      // Initialize BullMQ queue service
      videoQueueService = createVideoQueueService({
        redis: {
          host: env.REDIS_HOST,
          port: env.REDIS_PORT,
          password: env.REDIS_PASSWORD,
        },
      });
      console.log('📤 BullMQ video queue service initialized');

      // Create queue function for use cases
      queueVideoForProcessing = async (
        videoId: string,
        rawFilePath: string
      ) => {
        return videoQueueService!.addEncodingJob({ videoId, rawFilePath });
      };
    } catch (error) {
      console.warn(
        '⚠️ Video services not available, video features disabled:',
        error
      );
    }

    // Build dependency container
    const container = createContainer({
      db,
      pool,
      env,
      passwordHasher,
      tokenGenerator,
      storageService,
      videoQueueService,
      queueVideoForProcessing,
    });

    // Create Express app
    const app = createApp({
      env: container.env,
      userRepository: container.userRepository,
      postRepository: container.postRepository,
      sessionRepository: container.sessionRepository,
      categoryRepository: container.categoryRepository,
      tagRepository: container.tagRepository,
      followRepository: container.followRepository,
      likeRepository: container.likeRepository,
      commentRepository: container.commentRepository,
      commentLikeRepository: container.commentLikeRepository,
      videoRepository: container.videoRepository,
      videoQualityRepository: container.videoQualityRepository,
      bookmarkRepository: container.bookmarkRepository,
      bookmarkFolderRepository: container.bookmarkFolderRepository,
      passwordHasher: container.passwordHasher,
      tokenGenerator: container.tokenGenerator,
      emailVerificationTokenRepository:
        container.emailVerificationTokenRepository,
      passwordResetTokenRepository: container.passwordResetTokenRepository,
      emailService: container.emailService,
      storageService: container.storageService,
      videoQueueService: container.videoQueueService,
      queueVideoForProcessing: container.queueVideoForProcessing,
    });

    // Start server
    const server = app.listen(env.PORT, env.HOST, () => {
      console.log(`✅ API Server running at http://${env.HOST}:${env.PORT}`);
      console.log(`📍 Health check: http://${env.HOST}:${env.PORT}/health`);
      console.log(`🔐 Auth endpoints: http://${env.HOST}:${env.PORT}/api/auth`);
      if (storageService && videoQueueService) {
        console.log(
          `🎬 Video endpoints: http://${env.HOST}:${env.PORT}/api/videos`
        );
      }
      if (env.NODE_ENV !== 'production') {
        console.log(`📚 API Docs: http://${env.HOST}:${env.PORT}/api-docs`);
      }
    });

    // Graceful shutdown
    const shutdown = async () => {
      console.log('\n🛑 Shutting down gracefully...');

      // Close queue service
      if (videoQueueService) {
        await videoQueueService.close();
      }

      server.close(async () => {
        console.log('👋 Server closed');
        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

main();
