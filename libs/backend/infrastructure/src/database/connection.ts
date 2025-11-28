/**
 * Database Connection Module
 *
 * Provides PostgreSQL connection pool and Kysely instance
 * for type-safe database operations.
 */

import { Kysely, PostgresDialect, CamelCasePlugin } from 'kysely';
import pg from 'pg';
import type { Database } from './types.js';

const { Pool } = pg;

// =====================================================
// CONFIGURATION
// =====================================================

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  ssl?: boolean;
  maxConnections?: number;
  idleTimeoutMs?: number;
  connectionTimeoutMs?: number;
}

/**
 * Load database config from environment variables
 */
export function loadDatabaseConfig(): DatabaseConfig {
  return {
    host: process.env['DATABASE_HOST'] ?? 'localhost',
    port: parseInt(process.env['DATABASE_PORT'] ?? '5432', 10),
    database: process.env['DATABASE_NAME'] ?? 'blog_video_platform',
    user: process.env['DATABASE_USER'] ?? 'postgres',
    password: process.env['DATABASE_PASSWORD'] ?? 'postgres',
    ssl: process.env['DATABASE_SSL'] === 'true',
    maxConnections: parseInt(
      process.env['DATABASE_MAX_CONNECTIONS'] ?? '20',
      10
    ),
    idleTimeoutMs: parseInt(
      process.env['DATABASE_IDLE_TIMEOUT_MS'] ?? '30000',
      10
    ),
    connectionTimeoutMs: parseInt(
      process.env['DATABASE_CONNECTION_TIMEOUT_MS'] ?? '5000',
      10
    ),
  };
}

// =====================================================
// CONNECTION POOL
// =====================================================

/**
 * Create a PostgreSQL connection pool
 */
export function createPool(config: DatabaseConfig): pg.Pool {
  return new Pool({
    host: config.host,
    port: config.port,
    database: config.database,
    user: config.user,
    password: config.password,
    ssl: config.ssl ? { rejectUnauthorized: false } : undefined,
    max: config.maxConnections,
    idleTimeoutMillis: config.idleTimeoutMs,
    connectionTimeoutMillis: config.connectionTimeoutMs,
  });
}

// =====================================================
// KYSELY INSTANCE
// =====================================================

/**
 * Create a Kysely database instance
 */
export function createKyselyInstance(pool: pg.Pool): Kysely<Database> {
  return new Kysely<Database>({
    dialect: new PostgresDialect({
      pool,
    }),
    plugins: [
      // Converts snake_case columns to camelCase in TypeScript
      new CamelCasePlugin(),
    ],
  });
}

// =====================================================
// SINGLETON DATABASE CONNECTION
// =====================================================

let dbInstance: Kysely<Database> | null = null;
let poolInstance: pg.Pool | null = null;

/**
 * Get or create the singleton database instance
 */
export function getDatabase(config?: DatabaseConfig): Kysely<Database> {
  if (!dbInstance) {
    const dbConfig = config ?? loadDatabaseConfig();
    poolInstance = createPool(dbConfig);
    dbInstance = createKyselyInstance(poolInstance);
  }

  return dbInstance;
}

/**
 * Close database connection
 */
export async function closeDatabase(): Promise<void> {
  if (dbInstance) {
    await dbInstance.destroy();
    dbInstance = null;
    poolInstance = null;
  }
}

/**
 * Get the raw pg.Pool instance (for advanced use cases)
 */
export function getPool(): pg.Pool | null {
  return poolInstance;
}

// =====================================================
// TRANSACTION HELPER
// =====================================================

export type TransactionCallback<T> = (trx: Kysely<Database>) => Promise<T>;

/**
 * Execute operations within a transaction
 */
export async function withTransaction<T>(
  db: Kysely<Database>,
  callback: TransactionCallback<T>
): Promise<T> {
  return await db.transaction().execute(callback);
}

// =====================================================
// HEALTH CHECK
// =====================================================

/**
 * Check database connection health
 */
export async function checkDatabaseHealth(
  db: Kysely<Database>
): Promise<boolean> {
  try {
    const result = await db
      .selectFrom('users')
      .select(db.fn.count<number>('id').as('count'))
      .executeTakeFirst();
    return result !== undefined;
  } catch {
    return false;
  }
}

// =====================================================
// EXPORTS
// =====================================================

export { Kysely } from 'kysely';
export type { Database } from './types.js';
