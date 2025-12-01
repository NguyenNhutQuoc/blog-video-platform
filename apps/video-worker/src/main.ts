/**
 * Video Worker Entry Point
 *
 * Starts the video encoding worker that processes jobs from BullMQ queue.
 */

import { loadEnv } from './config/env.js';
import { createVideoEncodingWorker } from './worker.js';
import {
  createMinIOService,
  createFFmpegService,
  getDatabase,
  PostgresVideoRepository,
} from '@blog/backend/infrastructure';
import * as fs from 'fs';

async function main() {
  try {
    // Load environment
    const env = loadEnv();
    console.log(`🎬 Starting Video Worker in ${env.NODE_ENV} mode...`);
    console.log(`📦 Worker concurrency: ${env.WORKER_CONCURRENCY}`);

    // Ensure temp directory exists
    if (!fs.existsSync(env.TEMP_DIR)) {
      fs.mkdirSync(env.TEMP_DIR, { recursive: true });
      console.log(`📁 Created temp directory: ${env.TEMP_DIR}`);
    }

    // Initialize database
    console.log('💾 Connecting to database...');
    const db = getDatabase({
      host: env.DATABASE_HOST,
      port: env.DATABASE_PORT,
      database: env.DATABASE_NAME,
      user: env.DATABASE_USER,
      password: env.DATABASE_PASSWORD,
    });

    // Initialize MinIO storage service
    console.log('📦 Connecting to MinIO...');
    const storageService = await createMinIOService({
      endPoint: env.MINIO_ENDPOINT,
      port: env.MINIO_PORT,
      useSSL: env.MINIO_USE_SSL,
      accessKey: env.MINIO_ACCESS_KEY,
      secretKey: env.MINIO_SECRET_KEY,
    });

    // Initialize FFmpeg service
    console.log('🎥 Initializing FFmpeg...');
    const ffmpegService = createFFmpegService(
      env.FFMPEG_PATH,
      env.FFPROBE_PATH
    );

    // Check if FFmpeg is available
    const ffmpegAvailable = await ffmpegService.isAvailable();
    if (!ffmpegAvailable) {
      throw new Error(
        'FFmpeg is not available. Please ensure FFmpeg is installed.'
      );
    }

    const ffmpegVersion = await ffmpegService.getVersion();
    console.log(`  FFmpeg version: ${ffmpegVersion}`);

    // Initialize video repository
    const videoRepository = new PostgresVideoRepository(db);

    // Create worker with dependencies
    const worker = createVideoEncodingWorker(
      {
        redis: {
          host: env.REDIS_HOST,
          port: env.REDIS_PORT,
          password: env.REDIS_PASSWORD,
        },
        concurrency: env.WORKER_CONCURRENCY,
        tempDir: env.TEMP_DIR,
        minioEndpoint: `http://${env.MINIO_ENDPOINT}:${env.MINIO_PORT}`,
      },
      {
        storageService,
        ffmpegService,
        videoRepository,
      }
    );

    console.log('✅ Video Worker started');
    console.log(`📡 Listening for jobs on queue: video-encoding`);
    console.log(`🔗 Redis: ${env.REDIS_HOST}:${env.REDIS_PORT}`);
    console.log(`📦 MinIO: ${env.MINIO_ENDPOINT}:${env.MINIO_PORT}`);

    // Graceful shutdown
    const shutdown = async () => {
      console.log('\n🛑 Received shutdown signal...');
      await worker.close();
      await db.destroy();
      process.exit(0);
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

    // Keep process alive
    process.stdin.resume();
  } catch (error) {
    console.error('❌ Failed to start worker:', error);
    process.exit(1);
  }
}

main();
