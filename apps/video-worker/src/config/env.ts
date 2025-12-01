/**
 * Video Worker Environment Configuration
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { z } from 'zod';

// Load .env file from workspace root
const envPath = resolve(process.cwd(), '.env');
const result = config({ path: envPath });

if (result.error) {
  console.warn('⚠️ Could not load .env file:', envPath);
} else {
  console.log('✅ Loaded .env file from:', envPath);
}

const EnvSchema = z.object({
  // Worker
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  WORKER_CONCURRENCY: z.string().default('2').transform(Number),

  // Database
  DATABASE_HOST: z.string().default('localhost'),
  DATABASE_PORT: z.string().default('5432').transform(Number),
  DATABASE_NAME: z.string().default('blog_video_platform'),
  DATABASE_USER: z.string().default('postgres'),
  DATABASE_PASSWORD: z.string().default('postgres'),

  // MinIO / S3 Configuration
  MINIO_ENDPOINT: z.string().default('localhost'),
  MINIO_PORT: z.string().default('9000').transform(Number),
  MINIO_USE_SSL: z
    .string()
    .default('false')
    .transform((val) => val === 'true'),
  MINIO_ACCESS_KEY: z.string().default('minio_admin'),
  MINIO_SECRET_KEY: z.string().default('minio_password_change_in_production'),
  MINIO_PUBLIC_URL: z.string().optional(),

  // Redis Configuration
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.string().default('6379').transform(Number),
  REDIS_PASSWORD: z.string().default('redis_password_change_in_production'),

  // FFmpeg Configuration
  FFMPEG_PATH: z.string().optional(),
  FFPROBE_PATH: z.string().optional(),
  TEMP_DIR: z.string().default('/tmp/video-processing'),
});

export type Env = z.infer<typeof EnvSchema>;

let envCache: Env | null = null;

export function loadEnv(): Env {
  if (envCache) return envCache;

  const parseResult = EnvSchema.safeParse(process.env);

  if (!parseResult.success) {
    console.error('❌ Invalid environment variables:');
    console.error(parseResult.error.flatten().fieldErrors);
    throw new Error('Invalid environment variables');
  }

  envCache = parseResult.data;
  return envCache;
}
