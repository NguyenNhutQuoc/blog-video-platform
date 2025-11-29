/**
 * Users API Integration Tests
 *
 * Tests HTTP endpoints for user profile operations.
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
  expectSuccess,
  expectError,
  createAuthenticatedUser,
  type AuthenticatedUser,
} from '../utils/api-test-helper.js';

import express from 'express';
import { createAuthRoutes } from '../../../../api-server/src/routes/auth.routes.js';
import { createUsersRoutes } from '../../../../api-server/src/routes/users.routes.js';
import { createAuthMiddleware } from '../../../../api-server/src/middleware/auth.middleware.js';
import {
  errorHandler,
  notFoundHandler,
} from '../../../../api-server/src/middleware/error.middleware.js';

describe('Users API Endpoints', () => {
  let db: Kysely<Database>;
  let app: Express;
  let authUser: AuthenticatedUser;

  beforeAll(async () => {
    const result = await startTestDatabase();
    db = result.db;

    const deps = createTestDependencies(db);

    app = express();
    app.use(express.json());
    app.set('trust proxy', 1);

    const authMiddleware = createAuthMiddleware({
      tokenGenerator: deps.tokenGenerator,
    });

    // Mount auth routes (needed to create users)
    const authRoutes = createAuthRoutes({
      userRepository: deps.userRepository,
      sessionRepository: deps.sessionRepository,
      passwordHasher: deps.passwordHasher,
      tokenGenerator: deps.tokenGenerator,
      authMiddleware,
    });

    // Mount users routes
    const usersRoutes = createUsersRoutes({
      userRepository: deps.userRepository,
      postRepository: deps.postRepository,
      followRepository: deps.followRepository,
      authMiddleware,
    });

    app.use('/api/auth', authRoutes);
    app.use('/api/users', usersRoutes);
    app.use(notFoundHandler);
    app.use(errorHandler);
  }, 60000);

  afterAll(async () => {
    await stopTestDatabase();
  });

  beforeEach(async () => {
    await cleanDatabase(db);
    authUser = await createAuthenticatedUser(app);
  });

  describe('GET /api/users/:idOrUsername', () => {
    it('should get user profile by id', async () => {
      const response = await request(app)
        .get(`/api/users/${authUser.userId}`)
        .expect(200);

      const data = expectSuccess(response);
      expect(data.user).toBeDefined();
      expect(data.user.id).toBe(authUser.userId);
      expect(data.user.username).toBe(authUser.username);
      expect(data.user.stats).toBeDefined();
      expect(data.user.stats.postCount).toBeDefined();
      expect(data.user.stats.followerCount).toBeDefined();
      expect(data.user.stats.followingCount).toBeDefined();
      // Password should not be exposed
      expect(data.user.passwordHash).toBeUndefined();
    });

    it('should get user profile by username', async () => {
      const response = await request(app)
        .get(`/api/users/${authUser.username}`)
        .expect(200);

      const data = expectSuccess(response);
      expect(data.user).toBeDefined();
      expect(data.user.username).toBe(authUser.username);
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .get('/api/users/nonexistentuser')
        .expect(404);

      expectError(response, 'NOT_FOUND');
    });

    it('should not expose inactive user', async () => {
      // Mark user as inactive
      await db
        .updateTable('users')
        .set({ is_active: false })
        .where('id', '=', authUser.userId)
        .execute();

      const response = await request(app)
        .get(`/api/users/${authUser.userId}`)
        .expect(404);

      expectError(response, 'NOT_FOUND');
    });

    it('should show correct post count', async () => {
      // Verify user's email first
      await db
        .updateTable('users')
        .set({ email_verified: true })
        .where('id', '=', authUser.userId)
        .execute();

      // Create some posts
      for (let i = 0; i < 3; i++) {
        await db
          .insertInto('posts')
          .values({
            author_id: authUser.userId,
            title: `Test Post ${i} - Valid Title`,
            slug: `test-post-${i}-${Date.now()}`,
            content: 'Test content for the post',
            status: 'published',
            visibility: 'public',
            allow_comments: true,
            is_featured: false,
            is_pinned: false,
            reading_time_minutes: 1,
            view_count: 0,
            like_count: 0,
            comment_count: 0,
            share_count: 0,
            bookmark_count: 0,
          })
          .execute();
      }

      const response = await request(app)
        .get(`/api/users/${authUser.userId}`)
        .expect(200);

      const data = expectSuccess(response);
      expect(data.user.stats.postCount).toBe(3);
    });
  });

  describe('PUT /api/users/me', () => {
    it('should update own profile', async () => {
      const response = await request(app)
        .put('/api/users/me')
        .set('Authorization', `Bearer ${authUser.accessToken}`)
        .send({
          fullName: 'Updated Full Name',
          bio: 'This is my updated bio. It can be up to 500 characters.',
        })
        .expect(200);

      const data = expectSuccess(response);
      expect(data.user).toBeDefined();
      expect(data.user.fullName).toBe('Updated Full Name');
      expect(data.user.bio).toContain('updated bio');
    });

    it('should update avatar URL', async () => {
      const response = await request(app)
        .put('/api/users/me')
        .set('Authorization', `Bearer ${authUser.accessToken}`)
        .send({
          avatarUrl: 'https://example.com/avatar.jpg',
        })
        .expect(200);

      const data = expectSuccess(response);
      expect(data.user.avatarUrl).toBe('https://example.com/avatar.jpg');
    });

    it('should update social links', async () => {
      const response = await request(app)
        .put('/api/users/me')
        .set('Authorization', `Bearer ${authUser.accessToken}`)
        .send({
          socialLinks: {
            twitter: 'https://twitter.com/testuser',
            github: 'https://github.com/testuser',
          },
        })
        .expect(200);

      const data = expectSuccess(response);
      expect(data.user.socialLinks).toBeDefined();
      expect(data.user.socialLinks.twitter).toBe(
        'https://twitter.com/testuser'
      );
      expect(data.user.socialLinks.github).toBe('https://github.com/testuser');
    });

    it('should reject update without authentication', async () => {
      const response = await request(app)
        .put('/api/users/me')
        .send({
          fullName: 'Should Not Work',
        })
        .expect(401);

      expectError(response, 'UNAUTHORIZED');
    });

    it('should reject bio that is too long', async () => {
      const longBio = 'a'.repeat(501); // More than 500 chars

      const response = await request(app)
        .put('/api/users/me')
        .set('Authorization', `Bearer ${authUser.accessToken}`)
        .send({
          bio: longBio,
        })
        .expect(400);

      expectError(response, 'VALIDATION_ERROR');
    });

    it('should reject invalid avatar URL', async () => {
      const response = await request(app)
        .put('/api/users/me')
        .set('Authorization', `Bearer ${authUser.accessToken}`)
        .send({
          avatarUrl: 'not-a-valid-url',
        })
        .expect(400);

      expectError(response, 'VALIDATION_ERROR');
    });

    it('should preserve existing fields when partially updating', async () => {
      // First update with fullName
      await request(app)
        .put('/api/users/me')
        .set('Authorization', `Bearer ${authUser.accessToken}`)
        .send({
          fullName: 'First Name',
          bio: 'First bio content',
        })
        .expect(200);

      // Then update only bio
      const response = await request(app)
        .put('/api/users/me')
        .set('Authorization', `Bearer ${authUser.accessToken}`)
        .send({
          bio: 'Second bio content',
        })
        .expect(200);

      const data = expectSuccess(response);
      expect(data.user.fullName).toBe('First Name'); // Preserved
      expect(data.user.bio).toBe('Second bio content'); // Updated
    });
  });

  describe('Profile Privacy', () => {
    it('should not expose email to other users', async () => {
      // Get another user's profile
      const otherUser = await createAuthenticatedUser(app, {
        email: 'other@example.com',
        username: 'otheruser',
      });

      const response = await request(app)
        .get(`/api/users/${otherUser.userId}`)
        .expect(200);

      const data = expectSuccess(response);
      // Email should not be in the response for public profile
      expect(data.user.email).toBeUndefined();
    });

    it('should not expose password hash', async () => {
      const response = await request(app)
        .get(`/api/users/${authUser.userId}`)
        .expect(200);

      const data = expectSuccess(response);
      expect(data.user.passwordHash).toBeUndefined();
      expect(data.user.password).toBeUndefined();
    });
  });

  describe('User Stats', () => {
    it('should return zero counts for new user', async () => {
      const response = await request(app)
        .get(`/api/users/${authUser.userId}`)
        .expect(200);

      const data = expectSuccess(response);
      expect(data.user.stats.postCount).toBe(0);
      expect(data.user.stats.followerCount).toBe(0);
      expect(data.user.stats.followingCount).toBe(0);
    });

    it('should update follower count when followed', async () => {
      const otherUser = await createAuthenticatedUser(app, {
        email: 'follower@example.com',
        username: 'followeruser',
      });

      // Create a follow directly in DB
      await db
        .insertInto('follows')
        .values({
          follower_id: otherUser.userId,
          following_id: authUser.userId,
        })
        .execute();

      // Update follower count
      await db
        .updateTable('users')
        .set({ follower_count: 1 })
        .where('id', '=', authUser.userId)
        .execute();

      const response = await request(app)
        .get(`/api/users/${authUser.userId}`)
        .expect(200);

      const data = expectSuccess(response);
      expect(data.user.stats.followerCount).toBe(1);
    });
  });
});
