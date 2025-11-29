/**
 * Test Database Utilities
 *
 * Provides PostgreSQL testcontainer setup for integration tests.
 */

import {
  PostgreSqlContainer,
  type StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import { Kysely, PostgresDialect } from 'kysely';
import pg from 'pg';
import fs from 'fs';
import path from 'path';
import type { Database } from '../database/types.js';

const { Pool } = pg;

let container: StartedPostgreSqlContainer | null = null;
let testDb: Kysely<Database> | null = null;

/**
 * Start a PostgreSQL test container
 */
export async function startTestDatabase(): Promise<{
  db: Kysely<Database>;
  container: StartedPostgreSqlContainer;
}> {
  // Start PostgreSQL container
  container = await new PostgreSqlContainer('postgres:15-alpine')
    .withDatabase('test_db')
    .withUsername('test')
    .withPassword('test')
    .start();

  // Create connection pool
  const pool = new Pool({
    host: container.getHost(),
    port: container.getMappedPort(5432),
    database: container.getDatabase(),
    user: container.getUsername(),
    password: container.getPassword(),
  });

  // Create Kysely instance
  testDb = new Kysely<Database>({
    dialect: new PostgresDialect({ pool }),
  });

  // Run migrations
  await runMigrations(pool);

  return { db: testDb, container };
}

/**
 * Run database migrations
 */
async function runMigrations(pool: pg.Pool): Promise<void> {
  // List of migration files to run in order
  const migrationFiles = [
    'database/migrations/001_initial_schema.sql',
    'database/migrations/002_security_tokens.sql',
    'database/migrations/003_follows.sql',
  ];

  for (const migrationFile of migrationFiles) {
    const migrationPath = path.resolve(process.cwd(), migrationFile);

    if (fs.existsSync(migrationPath)) {
      const migration = fs.readFileSync(migrationPath, 'utf-8');

      // Split by semicolons and execute each statement
      const statements = migration
        .split(';')
        .map((s) => s.trim())
        .filter((s) => s.length > 0 && !s.startsWith('--'));

      for (const statement of statements) {
        try {
          // Skip extension creation (may not be available in test container)
          if (statement.includes('CREATE EXTENSION')) {
            continue;
          }
          // Skip vector-related statements
          if (statement.includes('vector') || statement.includes('ivfflat')) {
            continue;
          }
          await pool.query(statement);
        } catch (error) {
          // Ignore errors for optional features
          console.warn(
            `Migration statement failed (may be ok): ${
              (error as Error).message
            }`
          );
        }
      }
    }
  }
}

/**
 * Stop the test database
 */
export async function stopTestDatabase(): Promise<void> {
  if (testDb) {
    await testDb.destroy();
    testDb = null;
  }
  if (container) {
    await container.stop();
    container = null;
  }
}

/**
 * Get the test database instance
 */
export function getTestDatabase(): Kysely<Database> {
  if (!testDb) {
    throw new Error(
      'Test database not initialized. Call startTestDatabase() first.'
    );
  }
  return testDb;
}

/**
 * Clean all tables (for test isolation)
 */
export async function cleanDatabase(db: Kysely<Database>): Promise<void> {
  // Delete in correct order to respect foreign keys
  await db.deleteFrom('activity_logs').execute();
  await db.deleteFrom('search_queries').execute();
  await db.deleteFrom('video_views').execute();
  await db.deleteFrom('post_views').execute();
  await db.deleteFrom('sessions').execute();
  await db.deleteFrom('bookmarks').execute();
  await db.deleteFrom('bookmark_folders').execute();
  await db.deleteFrom('likes').execute();
  await db.deleteFrom('comments').execute();
  await db.deleteFrom('post_tags').execute();
  await db.deleteFrom('post_categories').execute();
  await db.deleteFrom('videos').execute();
  await db.deleteFrom('posts').execute();
  await db.deleteFrom('follows').execute();
  await db.deleteFrom('tags').execute();
  await db.deleteFrom('categories').execute();
  await db.deleteFrom('users').execute();
}
