/**
 * Environment Configuration
 *
 * Loads and validates environment variables.
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { z } from 'zod';

// Load .env file from workspace root
const envPath = resolve(process.cwd(), '.env');
const result = config({ path: envPath });

console.log(result.parsed);

if (result.error) {
  console.warn('⚠️ Could not load .env file:', envPath);
} else {
  console.log('✅ Loaded .env file from:', envPath);
}

const EnvSchema = z.object({
  // Server
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z.string().default('3000').transform(Number),
  HOST: z.string().default('localhost'),

  // Logging
  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace'])
    .default('info'),

  // Database
  DATABASE_HOST: z.string().default('localhost'),
  DATABASE_PORT: z.string().default('5432').transform(Number),
  DATABASE_NAME: z.string().default('blog_video_platform'),
  DATABASE_USER: z.string().default('postgres'),
  DATABASE_PASSWORD: z.string().default('postgres'),

  // JWT
  JWT_SECRET: z
    .string()
    .min(32)
    .default('default-jwt-secret-change-in-production-min-32-chars'),
  JWT_ACCESS_SECRET: z.string().optional(),
  JWT_REFRESH_SECRET: z.string().optional(),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  // CORS
  CORS_ORIGIN: z.string().default('http://localhost:3001'),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().default('900000').transform(Number), // 15 minutes
  RATE_LIMIT_MAX: z.string().default('100').transform(Number),
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

export function getEnv(): Env {
  if (!envCache) {
    return loadEnv();
  }
  return envCache;
}
