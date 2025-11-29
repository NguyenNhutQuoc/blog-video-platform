/**
 * API Test Helper Utilities
 *
 * Provides supertest setup and authenticated request helpers.
 */

import type { Express } from 'express';
import request from 'supertest';
import type { Kysely } from 'kysely';
import type { Database } from '../../database/types.js';
import { PostgresUserRepository } from '../../repositories/user.repository.js';
import { PostgresSessionRepository } from '../../repositories/session.repository.js';
import { PostgresPostRepository } from '../../repositories/post.repository.js';
import { PostgresCategoryRepository } from '../../repositories/category.repository.js';
import { PostgresTagRepository } from '../../repositories/tag.repository.js';
import { PostgresFollowRepository } from '../../repositories/follow.repository.js';
import { BcryptPasswordHasher } from '../../auth/password-hasher.js';
import { JwtTokenGenerator } from '../../auth/token-generator.js';
import type {
  IUserRepository,
  ISessionRepository,
  IPostRepository,
  ICategoryRepository,
  ITagRepository,
  IFollowRepository,
  IPasswordHasher,
  ITokenGenerator,
} from '@blog-video-platform/core';

/**
 * Test JWT configuration
 */
export const TEST_JWT_CONFIG = {
  accessTokenSecret: 'test-access-secret-key-must-be-long-enough-32-chars',
  refreshTokenSecret: 'test-refresh-secret-key-must-be-long-enough-32-chars',
  accessTokenExpiresInSeconds: 900, // 15 minutes
  refreshTokenExpiresInSeconds: 604800, // 7 days
  issuer: 'test-issuer',
  audience: 'test-audience',
};

/**
 * Test environment configuration
 */
export const TEST_ENV = {
  NODE_ENV: 'test' as const,
  PORT: 3000,
  HOST: 'localhost',
  DATABASE_HOST: 'localhost',
  DATABASE_PORT: 5432,
  DATABASE_NAME: 'test_db',
  DATABASE_USER: 'test',
  DATABASE_PASSWORD: 'test',
  JWT_SECRET: TEST_JWT_CONFIG.accessTokenSecret,
  JWT_ACCESS_SECRET: TEST_JWT_CONFIG.accessTokenSecret,
  JWT_REFRESH_SECRET: TEST_JWT_CONFIG.refreshTokenSecret,
  JWT_ACCESS_EXPIRES_IN: '15m',
  JWT_REFRESH_EXPIRES_IN: '7d',
  CORS_ORIGIN: 'http://localhost:3001',
  RATE_LIMIT_WINDOW_MS: 900000,
  RATE_LIMIT_MAX: 1000, // High limit for tests
};

/**
 * Test dependencies container
 */
export interface TestDependencies {
  db: Kysely<Database>;
  userRepository: IUserRepository;
  sessionRepository: ISessionRepository;
  postRepository: IPostRepository;
  categoryRepository: ICategoryRepository;
  tagRepository: ITagRepository;
  followRepository: IFollowRepository;
  passwordHasher: IPasswordHasher;
  tokenGenerator: ITokenGenerator;
}

/**
 * Create test dependencies from a database connection
 */
export function createTestDependencies(db: Kysely<Database>): TestDependencies {
  const userRepository = new PostgresUserRepository(db);
  const sessionRepository = new PostgresSessionRepository(db);
  const postRepository = new PostgresPostRepository(db);
  const categoryRepository = new PostgresCategoryRepository(db);
  const tagRepository = new PostgresTagRepository(db);
  const followRepository = new PostgresFollowRepository(db);
  const passwordHasher = new BcryptPasswordHasher();
  const tokenGenerator = new JwtTokenGenerator(TEST_JWT_CONFIG);

  return {
    db,
    userRepository,
    sessionRepository,
    postRepository,
    categoryRepository,
    tagRepository,
    followRepository,
    passwordHasher,
    tokenGenerator,
  };
}

/**
 * Authenticated test user data
 */
export interface AuthenticatedUser {
  userId: string;
  email: string;
  username: string;
  accessToken: string;
  refreshToken: string;
}

/**
 * Create an authenticated user and return tokens
 */
export async function createAuthenticatedUser(
  app: Express,
  userData?: {
    email?: string;
    username?: string;
    password?: string;
    fullName?: string;
  }
): Promise<AuthenticatedUser> {
  const uniqueSuffix = Date.now();
  const email = userData?.email ?? `testuser${uniqueSuffix}@example.com`;
  const username = userData?.username ?? `testuser${uniqueSuffix}`;
  const password = userData?.password ?? 'Password123!';

  // Register user
  const registerResponse = await request(app)
    .post('/api/auth/register')
    .send({
      email,
      username,
      password,
      fullName: userData?.fullName ?? 'Test User',
    })
    .expect(201);

  const { user, tokens } = registerResponse.body.data;

  return {
    userId: user.id,
    email: user.email,
    username: user.username,
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
  };
}

/**
 * Create an authenticated admin user
 */
export async function createAuthenticatedAdmin(
  deps: TestDependencies,
  app: Express
): Promise<AuthenticatedUser> {
  // First create regular user
  const authUser = await createAuthenticatedUser(app, {
    email: `admin${Date.now()}@example.com`,
    username: `adminuser${Date.now()}`,
  });

  // Then update to admin in database
  await deps.db
    .updateTable('users')
    .set({ is_admin: true, email_verified: true })
    .where('id', '=', authUser.userId)
    .execute();

  // Get new tokens with admin claims
  const loginResponse = await request(app)
    .post('/api/auth/login')
    .send({
      email: authUser.email,
      password: 'Password123!',
    })
    .expect(200);

  return {
    ...authUser,
    accessToken: loginResponse.body.data.tokens.accessToken,
    refreshToken: loginResponse.body.data.tokens.refreshToken,
  };
}

/**
 * Make authenticated request helper
 */
export function authenticatedRequest(
  app: Express,
  accessToken: string
): {
  get: (url: string) => request.Test;
  post: (url: string) => request.Test;
  put: (url: string) => request.Test;
  patch: (url: string) => request.Test;
  delete: (url: string) => request.Test;
} {
  return {
    get: (url: string) =>
      request(app).get(url).set('Authorization', `Bearer ${accessToken}`),
    post: (url: string) =>
      request(app).post(url).set('Authorization', `Bearer ${accessToken}`),
    put: (url: string) =>
      request(app).put(url).set('Authorization', `Bearer ${accessToken}`),
    patch: (url: string) =>
      request(app).patch(url).set('Authorization', `Bearer ${accessToken}`),
    delete: (url: string) =>
      request(app).delete(url).set('Authorization', `Bearer ${accessToken}`),
  };
}

/**
 * Response assertion helpers
 */
export const expectSuccess = (response: request.Response) => {
  expect(response.body.success).toBe(true);
  expect(response.body.data).toBeDefined();
  return response.body.data;
};

export const expectError = (
  response: request.Response,
  expectedCode?: string
) => {
  expect(response.body.success).toBe(false);
  expect(response.body.error).toBeDefined();
  if (expectedCode) {
    expect(response.body.error.code).toBe(expectedCode);
  }
  return response.body.error;
};

/**
 * Wait helper for async operations
 */
export const wait = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));
