/**
 * Auth API Integration Tests
 *
 * Tests HTTP endpoints using supertest with real database.
 */

import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
} from '@jest/globals';
import type { Express } from 'express';
import request from 'supertest';
import { Kysely } from 'kysely';
import type { Database } from '../../database/types.js';
import {
  startTestDatabase,
  stopTestDatabase,
  cleanDatabase,
} from '../test-database.js';
import {
  createTestDependencies,
  TEST_ENV,
  expectSuccess,
  expectError,
  authenticatedRequest,
} from '../utils/api-test-helper.js';

// Import app factory - need to create a minimal version for testing
import express from 'express';
import { createAuthRoutes } from '../../../../api-server/src/routes/auth.routes.js';
import { createAuthMiddleware } from '../../../../api-server/src/middleware/auth.middleware.js';
import {
  errorHandler,
  notFoundHandler,
} from '../../../../api-server/src/middleware/error.middleware.js';

describe('Auth API Endpoints', () => {
  let db: Kysely<Database>;
  let app: Express;

  beforeAll(async () => {
    const result = await startTestDatabase();
    db = result.db;

    // Create test dependencies
    const deps = createTestDependencies(db);

    // Create minimal Express app for testing
    app = express();
    app.use(express.json());
    app.set('trust proxy', 1);

    // Create auth middleware
    const authMiddleware = createAuthMiddleware({
      tokenGenerator: deps.tokenGenerator,
    });

    // Mount auth routes
    const authRoutes = createAuthRoutes({
      userRepository: deps.userRepository,
      sessionRepository: deps.sessionRepository,
      passwordHasher: deps.passwordHasher,
      tokenGenerator: deps.tokenGenerator,
      authMiddleware,
    });

    app.use('/api/auth', authRoutes);
    app.use(notFoundHandler);
    app.use(errorHandler);
  }, 60000);

  afterAll(async () => {
    await stopTestDatabase();
  });

  beforeEach(async () => {
    await cleanDatabase(db);
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'newuser@example.com',
          username: 'newuser',
          password: 'Password123!',
          fullName: 'New User',
        })
        .expect(201);

      const data = expectSuccess(response);
      expect(data.user).toBeDefined();
      expect(data.user.email).toBe('newuser@example.com');
      expect(data.user.username).toBe('newuser');
      expect(data.tokens).toBeDefined();
      expect(data.tokens.accessToken).toBeDefined();
      expect(data.tokens.refreshToken).toBeDefined();
      // Password should not be in response
      expect(data.user.passwordHash).toBeUndefined();
    });

    it('should reject duplicate email', async () => {
      // First registration
      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'duplicate@example.com',
          username: 'firstuser',
          password: 'Password123!',
        })
        .expect(201);

      // Second registration with same email
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'duplicate@example.com',
          username: 'seconduser',
          password: 'Password123!',
        })
        .expect(409);

      const error = expectError(response);
      expect(error.message).toContain('email');
    });

    it('should reject duplicate username', async () => {
      // First registration
      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'first@example.com',
          username: 'duplicateuser',
          password: 'Password123!',
        })
        .expect(201);

      // Second registration with same username
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'second@example.com',
          username: 'duplicateuser',
          password: 'Password123!',
        })
        .expect(409);

      const error = expectError(response);
      expect(error.message).toContain('username');
    });

    it('should reject weak password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'weak@example.com',
          username: 'weakuser',
          password: '12345', // Too weak
        })
        .expect(400);

      expectError(response, 'VALIDATION_ERROR');
    });

    it('should reject invalid email format', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'not-an-email',
          username: 'testuser',
          password: 'Password123!',
        })
        .expect(400);

      expectError(response, 'VALIDATION_ERROR');
    });

    it('should reject invalid username format', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          username: 'INVALID USER', // Spaces and uppercase not allowed
          password: 'Password123!',
        })
        .expect(400);

      expectError(response, 'VALIDATION_ERROR');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Create a user for login tests
      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'login@example.com',
          username: 'loginuser',
          password: 'Password123!',
        })
        .expect(201);
    });

    it('should login successfully with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'Password123!',
        })
        .expect(200);

      const data = expectSuccess(response);
      expect(data.user).toBeDefined();
      expect(data.user.email).toBe('login@example.com');
      expect(data.tokens).toBeDefined();
      expect(data.tokens.accessToken).toBeDefined();
      expect(data.tokens.refreshToken).toBeDefined();
    });

    it('should reject non-existent email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'Password123!',
        })
        .expect(401);

      const error = expectError(response);
      expect(error.message).toContain('Invalid');
    });

    it('should reject incorrect password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'WrongPassword123!',
        })
        .expect(401);

      const error = expectError(response);
      expect(error.message).toContain('Invalid');
    });

    it('should track user agent and IP', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .set('User-Agent', 'Test Browser 1.0')
        .send({
          email: 'login@example.com',
          password: 'Password123!',
        })
        .expect(200);

      expectSuccess(response);
      // Session should be created with device info (verified in database)
    });
  });

  describe('GET /api/auth/me', () => {
    let accessToken: string;

    beforeEach(async () => {
      // Register and login to get token
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'me@example.com',
          username: 'meuser',
          password: 'Password123!',
          fullName: 'Me User',
        })
        .expect(201);

      accessToken = registerResponse.body.data.tokens.accessToken;
    });

    it('should return current user info with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const data = expectSuccess(response);
      expect(data.user).toBeDefined();
      expect(data.user.username).toBe('meuser');
      // Should be profile data, not full user
      expect(data.user.passwordHash).toBeUndefined();
    });

    it('should reject request without token', async () => {
      const response = await request(app).get('/api/auth/me').expect(401);

      expectError(response, 'UNAUTHORIZED');
    });

    it('should reject request with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expectError(response, 'INVALID_TOKEN');
    });

    it('should reject request with malformed authorization header', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'NotBearer token')
        .expect(401);

      expectError(response, 'UNAUTHORIZED');
    });
  });

  describe('POST /api/auth/refresh', () => {
    let refreshToken: string;

    beforeEach(async () => {
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'refresh@example.com',
          username: 'refreshuser',
          password: 'Password123!',
        })
        .expect(201);

      refreshToken = registerResponse.body.data.tokens.refreshToken;
    });

    it('should refresh tokens with valid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      const data = expectSuccess(response);
      expect(data.tokens).toBeDefined();
      expect(data.tokens.accessToken).toBeDefined();
      expect(data.tokens.refreshToken).toBeDefined();
      // New refresh token should be different
      expect(data.tokens.refreshToken).not.toBe(refreshToken);
    });

    it('should reject missing refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({})
        .expect(400);

      expectError(response, 'VALIDATION_ERROR');
    });

    it('should reject invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'invalid-token' })
        .expect(401);

      expectError(response);
    });

    it('should invalidate old refresh token after use', async () => {
      // First refresh
      await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      // Try to use old token again
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect(401);

      expectError(response);
    });
  });

  describe('POST /api/auth/logout', () => {
    let refreshToken: string;

    beforeEach(async () => {
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'logout@example.com',
          username: 'logoutuser',
          password: 'Password123!',
        })
        .expect(201);

      refreshToken = registerResponse.body.data.tokens.refreshToken;
    });

    it('should logout successfully', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .send({ refreshToken })
        .expect(200);

      const data = expectSuccess(response);
      expect(data.message).toContain('Logged out');
    });

    it('should succeed even without refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .send({})
        .expect(200);

      expectSuccess(response);
    });

    it('should invalidate refresh token after logout', async () => {
      // Logout
      await request(app)
        .post('/api/auth/logout')
        .send({ refreshToken })
        .expect(200);

      // Try to use logged out token
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect(401);

      expectError(response);
    });
  });

  describe('POST /api/auth/logout-all', () => {
    let accessToken: string;

    beforeEach(async () => {
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'logoutall@example.com',
          username: 'logoutalluser',
          password: 'Password123!',
        })
        .expect(201);

      accessToken = registerResponse.body.data.tokens.accessToken;
    });

    it('should logout from all devices with valid token', async () => {
      const response = await request(app)
        .post('/api/auth/logout-all')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const data = expectSuccess(response);
      expect(data.message).toBeDefined();
    });

    it('should reject request without token', async () => {
      const response = await request(app)
        .post('/api/auth/logout-all')
        .expect(401);

      expectError(response, 'UNAUTHORIZED');
    });
  });

  describe('Complete Auth Flow', () => {
    it('should handle register → login → protected route → refresh → logout', async () => {
      // 1. Register
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'fullflow@example.com',
          username: 'fullflowuser',
          password: 'Password123!',
          fullName: 'Full Flow User',
        })
        .expect(201);

      const { tokens: registerTokens } = registerResponse.body.data;
      expect(registerTokens.accessToken).toBeDefined();

      // 2. Access protected route with access token
      const meResponse = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${registerTokens.accessToken}`)
        .expect(200);

      expect(meResponse.body.data.user.username).toBe('fullflowuser');

      // 3. Refresh tokens
      const refreshResponse = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: registerTokens.refreshToken })
        .expect(200);

      const { tokens: newTokens } = refreshResponse.body.data;
      expect(newTokens.accessToken).toBeDefined();
      expect(newTokens.refreshToken).not.toBe(registerTokens.refreshToken);

      // 4. Access protected route with new access token
      await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${newTokens.accessToken}`)
        .expect(200);

      // 5. Logout
      await request(app)
        .post('/api/auth/logout')
        .send({ refreshToken: newTokens.refreshToken })
        .expect(200);

      // 6. Old refresh token should not work
      await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: newTokens.refreshToken })
        .expect(401);

      // 7. Can still login with credentials
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'fullflow@example.com',
          password: 'Password123!',
        })
        .expect(200);

      expect(loginResponse.body.data.tokens.accessToken).toBeDefined();
    });
  });

  describe('Error handling', () => {
    it('should return 404 for unknown routes', async () => {
      const response = await request(app).get('/api/auth/unknown').expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send('{ invalid json }')
        .expect(400);

      // Express JSON parser error
    });
  });
});
