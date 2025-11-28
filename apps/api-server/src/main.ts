/**
 * API Server Entry Point
 */

import { loadEnv } from './config/env.js';
import { createApp } from './app.js';
import {
  getDatabase,
  createUserRepository,
  createSessionRepository,
  createPasswordHasher,
  createTokenGenerator,
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

    // Verify database connection

    // Initialize repositories
    const userRepository = createUserRepository(db);
    const sessionRepository = createSessionRepository(db);

    // Initialize services
    const passwordHasher = createPasswordHasher();
    const tokenGenerator = createTokenGenerator({
      accessTokenSecret: env.JWT_ACCESS_SECRET ?? env.JWT_SECRET,
      refreshTokenSecret: env.JWT_REFRESH_SECRET ?? env.JWT_SECRET + '-refresh',
    });

    // Create Express app
    const app = createApp({
      env,
      userRepository,
      sessionRepository,
      passwordHasher,
      tokenGenerator,
    });

    // Start server
    const server = app.listen(env.PORT, env.HOST, () => {
      console.log(`✅ API Server running at http://${env.HOST}:${env.PORT}`);
      console.log(`📍 Health check: http://${env.HOST}:${env.PORT}/health`);
      console.log(`🔐 Auth endpoints: http://${env.HOST}:${env.PORT}/api/auth`);
      if (env.NODE_ENV !== 'production') {
        console.log(`📚 API Docs: http://${env.HOST}:${env.PORT}/api-docs`);
      }
    });

    // Graceful shutdown
    const shutdown = async () => {
      console.log('\n🛑 Shutting down gracefully...');
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
