/**
 * Follows API Integration Tests
 *
 * Tests HTTP endpoints for follow/unfollow operations.
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
import { createFollowsRoutes } from '../../../../api-server/src/routes/follows.routes.js';
import { createAuthMiddleware } from '../../../../api-server/src/middleware/auth.middleware.js';
import {
  errorHandler,
  notFoundHandler,
} from '../../../../api-server/src/middleware/error.middleware.js';

describe('Follows API Endpoints', () => {
  let db: Kysely<Database>;
  let app: Express;
  let authUser: AuthenticatedUser;
  let targetUser: AuthenticatedUser;

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

    // Mount follows routes
    const followsRoutes = createFollowsRoutes({
      followRepository: deps.followRepository,
      userRepository: deps.userRepository,
      authMiddleware,
    });

    app.use('/api/auth', authRoutes);
    app.use('/api/users', followsRoutes);
    app.use(notFoundHandler);
    app.use(errorHandler);
  }, 60000);

  afterAll(async () => {
    await stopTestDatabase();
  });

  beforeEach(async () => {
    await cleanDatabase(db);
    authUser = await createAuthenticatedUser(app);
    targetUser = await createAuthenticatedUser(app, {
      email: 'target@example.com',
      username: 'targetuser',
    });
  });

  describe('POST /api/users/:userId/follow', () => {
    it('should follow a user successfully', async () => {
      const response = await request(app)
        .post(`/api/users/${targetUser.userId}/follow`)
        .set('Authorization', `Bearer ${authUser.accessToken}`)
        .expect(201);

      const data = expectSuccess(response);
      expect(data.follow).toBeDefined();
      expect(data.follow.followerId).toBe(authUser.userId);
      expect(data.follow.followingId).toBe(targetUser.userId);
    });

    it('should reject following self', async () => {
      const response = await request(app)
        .post(`/api/users/${authUser.userId}/follow`)
        .set('Authorization', `Bearer ${authUser.accessToken}`)
        .expect(400);

      const error = expectError(response);
      expect(error.message).toContain('Cannot follow yourself');
    });

    it('should reject duplicate follow', async () => {
      // First follow
      await request(app)
        .post(`/api/users/${targetUser.userId}/follow`)
        .set('Authorization', `Bearer ${authUser.accessToken}`)
        .expect(201);

      // Duplicate follow
      const response = await request(app)
        .post(`/api/users/${targetUser.userId}/follow`)
        .set('Authorization', `Bearer ${authUser.accessToken}`)
        .expect(409);

      const error = expectError(response);
      expect(error.message).toContain('Already following');
    });

    it('should reject following non-existent user', async () => {
      const response = await request(app)
        .post('/api/users/00000000-0000-0000-0000-000000000000/follow')
        .set('Authorization', `Bearer ${authUser.accessToken}`)
        .expect(404);

      expectError(response, 'NOT_FOUND');
    });

    it('should reject request without authentication', async () => {
      const response = await request(app)
        .post(`/api/users/${targetUser.userId}/follow`)
        .expect(401);

      expectError(response, 'UNAUTHORIZED');
    });

    it('should reject following inactive user', async () => {
      // Mark target as inactive
      await db
        .updateTable('users')
        .set({ is_active: false })
        .where('id', '=', targetUser.userId)
        .execute();

      const response = await request(app)
        .post(`/api/users/${targetUser.userId}/follow`)
        .set('Authorization', `Bearer ${authUser.accessToken}`)
        .expect(404);

      expectError(response, 'NOT_FOUND');
    });
  });

  describe('DELETE /api/users/:userId/follow', () => {
    beforeEach(async () => {
      // Create a follow relationship
      await request(app)
        .post(`/api/users/${targetUser.userId}/follow`)
        .set('Authorization', `Bearer ${authUser.accessToken}`)
        .expect(201);
    });

    it('should unfollow a user successfully', async () => {
      const response = await request(app)
        .delete(`/api/users/${targetUser.userId}/follow`)
        .set('Authorization', `Bearer ${authUser.accessToken}`)
        .expect(200);

      const data = expectSuccess(response);
      expect(data.message).toBeDefined();
    });

    it('should reject unfollowing when not following', async () => {
      // Unfollow first
      await request(app)
        .delete(`/api/users/${targetUser.userId}/follow`)
        .set('Authorization', `Bearer ${authUser.accessToken}`)
        .expect(200);

      // Try to unfollow again
      const response = await request(app)
        .delete(`/api/users/${targetUser.userId}/follow`)
        .set('Authorization', `Bearer ${authUser.accessToken}`)
        .expect(404);

      const error = expectError(response);
      expect(error.message).toContain('Not following');
    });

    it('should reject request without authentication', async () => {
      const response = await request(app)
        .delete(`/api/users/${targetUser.userId}/follow`)
        .expect(401);

      expectError(response, 'UNAUTHORIZED');
    });
  });

  describe('GET /api/users/:userId/followers', () => {
    beforeEach(async () => {
      // Create multiple followers for target user
      const follower1 = await createAuthenticatedUser(app, {
        email: 'follower1@example.com',
        username: 'follower1',
      });
      const follower2 = await createAuthenticatedUser(app, {
        email: 'follower2@example.com',
        username: 'follower2',
      });
      const follower3 = await createAuthenticatedUser(app, {
        email: 'follower3@example.com',
        username: 'follower3',
      });

      // Have them follow target user
      await request(app)
        .post(`/api/users/${targetUser.userId}/follow`)
        .set('Authorization', `Bearer ${follower1.accessToken}`)
        .expect(201);

      await request(app)
        .post(`/api/users/${targetUser.userId}/follow`)
        .set('Authorization', `Bearer ${follower2.accessToken}`)
        .expect(201);

      await request(app)
        .post(`/api/users/${targetUser.userId}/follow`)
        .set('Authorization', `Bearer ${follower3.accessToken}`)
        .expect(201);
    });

    it('should list followers of a user', async () => {
      const response = await request(app)
        .get(`/api/users/${targetUser.userId}/followers`)
        .expect(200);

      const data = expectSuccess(response);
      expect(data.followers).toBeDefined();
      expect(data.followers.length).toBe(3);
      expect(data.pagination).toBeDefined();
      expect(data.pagination.total).toBe(3);
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get(`/api/users/${targetUser.userId}/followers?limit=2&page=1`)
        .expect(200);

      const data = expectSuccess(response);
      expect(data.followers.length).toBe(2);
      expect(data.pagination.page).toBe(1);
      expect(data.pagination.limit).toBe(2);
      expect(data.pagination.total).toBe(3);
    });

    it('should return empty list for user with no followers', async () => {
      const response = await request(app)
        .get(`/api/users/${authUser.userId}/followers`)
        .expect(200);

      const data = expectSuccess(response);
      expect(data.followers).toEqual([]);
      expect(data.pagination.total).toBe(0);
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .get('/api/users/00000000-0000-0000-0000-000000000000/followers')
        .expect(404);

      expectError(response, 'NOT_FOUND');
    });
  });

  describe('GET /api/users/:userId/following', () => {
    beforeEach(async () => {
      // Create multiple users for authUser to follow
      const target1 = await createAuthenticatedUser(app, {
        email: 'target1@example.com',
        username: 'target1',
      });
      const target2 = await createAuthenticatedUser(app, {
        email: 'target2@example.com',
        username: 'target2',
      });

      // Have authUser follow them
      await request(app)
        .post(`/api/users/${target1.userId}/follow`)
        .set('Authorization', `Bearer ${authUser.accessToken}`)
        .expect(201);

      await request(app)
        .post(`/api/users/${target2.userId}/follow`)
        .set('Authorization', `Bearer ${authUser.accessToken}`)
        .expect(201);
    });

    it('should list users being followed', async () => {
      const response = await request(app)
        .get(`/api/users/${authUser.userId}/following`)
        .expect(200);

      const data = expectSuccess(response);
      expect(data.following).toBeDefined();
      expect(data.following.length).toBe(2);
      expect(data.pagination).toBeDefined();
      expect(data.pagination.total).toBe(2);
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get(`/api/users/${authUser.userId}/following?limit=1&page=1`)
        .expect(200);

      const data = expectSuccess(response);
      expect(data.following.length).toBe(1);
      expect(data.pagination.page).toBe(1);
      expect(data.pagination.limit).toBe(1);
      expect(data.pagination.total).toBe(2);
    });

    it('should return empty list for user following nobody', async () => {
      const response = await request(app)
        .get(`/api/users/${targetUser.userId}/following`)
        .expect(200);

      const data = expectSuccess(response);
      expect(data.following).toEqual([]);
      expect(data.pagination.total).toBe(0);
    });
  });

  describe('Complete Follow Flow', () => {
    it('should handle follow → verify → unfollow', async () => {
      // 1. Follow
      const followResponse = await request(app)
        .post(`/api/users/${targetUser.userId}/follow`)
        .set('Authorization', `Bearer ${authUser.accessToken}`)
        .expect(201);

      expect(followResponse.body.data.follow.followingId).toBe(
        targetUser.userId
      );

      // 2. Verify in followers list
      const followersResponse = await request(app)
        .get(`/api/users/${targetUser.userId}/followers`)
        .expect(200);

      expect(followersResponse.body.data.followers.length).toBe(1);
      expect(followersResponse.body.data.followers[0].id).toBe(authUser.userId);

      // 3. Verify in following list
      const followingResponse = await request(app)
        .get(`/api/users/${authUser.userId}/following`)
        .expect(200);

      expect(followingResponse.body.data.following.length).toBe(1);
      expect(followingResponse.body.data.following[0].id).toBe(
        targetUser.userId
      );

      // 4. Unfollow
      await request(app)
        .delete(`/api/users/${targetUser.userId}/follow`)
        .set('Authorization', `Bearer ${authUser.accessToken}`)
        .expect(200);

      // 5. Verify removed from followers
      const afterUnfollowResponse = await request(app)
        .get(`/api/users/${targetUser.userId}/followers`)
        .expect(200);

      expect(afterUnfollowResponse.body.data.followers.length).toBe(0);
    });

    it('should handle mutual follow', async () => {
      // User A follows User B
      await request(app)
        .post(`/api/users/${targetUser.userId}/follow`)
        .set('Authorization', `Bearer ${authUser.accessToken}`)
        .expect(201);

      // User B follows User A
      await request(app)
        .post(`/api/users/${authUser.userId}/follow`)
        .set('Authorization', `Bearer ${targetUser.accessToken}`)
        .expect(201);

      // Both should have 1 follower and 1 following
      const authFollowers = await request(app)
        .get(`/api/users/${authUser.userId}/followers`)
        .expect(200);

      const authFollowing = await request(app)
        .get(`/api/users/${authUser.userId}/following`)
        .expect(200);

      const targetFollowers = await request(app)
        .get(`/api/users/${targetUser.userId}/followers`)
        .expect(200);

      const targetFollowing = await request(app)
        .get(`/api/users/${targetUser.userId}/following`)
        .expect(200);

      expect(authFollowers.body.data.followers.length).toBe(1);
      expect(authFollowing.body.data.following.length).toBe(1);
      expect(targetFollowers.body.data.followers.length).toBe(1);
      expect(targetFollowing.body.data.following.length).toBe(1);
    });
  });
});
