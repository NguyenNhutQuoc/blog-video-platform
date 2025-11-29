/**
 * Posts API Integration Tests
 *
 * Tests HTTP endpoints for post CRUD operations.
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
import { createPostsRoutes } from '../../../../api-server/src/routes/posts.routes.js';
import {
  createAuthMiddleware,
  createOptionalAuthMiddleware,
} from '../../../../api-server/src/middleware/auth.middleware.js';
import {
  errorHandler,
  notFoundHandler,
} from '../../../../api-server/src/middleware/error.middleware.js';

describe('Posts API Endpoints', () => {
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

    const optionalAuthMiddleware = createOptionalAuthMiddleware({
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

    // Mount posts routes
    const postsRoutes = createPostsRoutes({
      postRepository: deps.postRepository,
      userRepository: deps.userRepository,
      categoryRepository: deps.categoryRepository,
      tagRepository: deps.tagRepository,
      authMiddleware,
      optionalAuthMiddleware,
    });

    app.use('/api/auth', authRoutes);
    app.use('/api/posts', postsRoutes);
    app.use(notFoundHandler);
    app.use(errorHandler);
  }, 60000);

  afterAll(async () => {
    await stopTestDatabase();
  });

  beforeEach(async () => {
    await cleanDatabase(db);
    // Create a verified user for most tests
    authUser = await createAuthenticatedUser(app);
    // Verify user's email in database
    await db
      .updateTable('users')
      .set({ email_verified: true })
      .where('id', '=', authUser.userId)
      .execute();
  });

  describe('POST /api/posts', () => {
    it('should create a post successfully', async () => {
      const response = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${authUser.accessToken}`)
        .send({
          title: 'My First Post - Testing the API',
          content:
            'This is the content of my first post. It needs to be long enough to pass validation. Lorem ipsum dolor sit amet.',
        })
        .expect(201);

      const data = expectSuccess(response);
      expect(data.post).toBeDefined();
      expect(data.post.title).toBe('My First Post - Testing the API');
      expect(data.post.slug).toBeDefined();
      expect(data.post.authorId).toBe(authUser.userId);
      expect(data.post.status).toBe('draft');
    });

    it('should reject post from unverified user', async () => {
      // Create unverified user
      const unverifiedUser = await createAuthenticatedUser(app, {
        email: 'unverified@example.com',
        username: 'unverifieduser',
      });

      const response = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${unverifiedUser.accessToken}`)
        .send({
          title: 'My First Post - Testing the API',
          content:
            'This is the content of my first post. It needs to be long enough.',
        })
        .expect(403);

      expectError(response);
    });

    it('should reject request without token', async () => {
      const response = await request(app)
        .post('/api/posts')
        .send({
          title: 'My Post Title',
          content: 'My post content',
        })
        .expect(401);

      expectError(response, 'UNAUTHORIZED');
    });

    it('should reject short title', async () => {
      const response = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${authUser.accessToken}`)
        .send({
          title: 'Short',
          content:
            'This is the content of my first post. It needs to be long enough to pass validation.',
        })
        .expect(400);

      expectError(response, 'VALIDATION_ERROR');
    });

    it('should reject short content', async () => {
      const response = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${authUser.accessToken}`)
        .send({
          title: 'This is a valid title for the post',
          content: 'Too short',
        })
        .expect(400);

      expectError(response, 'VALIDATION_ERROR');
    });
  });

  describe('GET /api/posts/:idOrSlug', () => {
    let postId: string;
    let postSlug: string;

    beforeEach(async () => {
      // Create a published post
      const createResponse = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${authUser.accessToken}`)
        .send({
          title: 'Published Post for Reading Tests',
          content:
            'This is the content of my published post. It needs to be long enough to pass validation.',
          status: 'published',
        })
        .expect(201);

      postId = createResponse.body.data.post.id;
      postSlug = createResponse.body.data.post.slug;
    });

    it('should get a post by id', async () => {
      const response = await request(app)
        .get(`/api/posts/${postId}`)
        .expect(200);

      const data = expectSuccess(response);
      expect(data.post).toBeDefined();
      expect(data.post.id).toBe(postId);
      expect(data.post.title).toBe('Published Post for Reading Tests');
    });

    it('should get a post by slug', async () => {
      const response = await request(app)
        .get(`/api/posts/${postSlug}`)
        .expect(200);

      const data = expectSuccess(response);
      expect(data.post).toBeDefined();
      expect(data.post.slug).toBe(postSlug);
    });

    it('should return 404 for non-existent post', async () => {
      const response = await request(app)
        .get('/api/posts/non-existent-slug')
        .expect(404);

      expectError(response, 'NOT_FOUND');
    });

    it('should not show draft post to other users', async () => {
      // Create draft post
      const draftResponse = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${authUser.accessToken}`)
        .send({
          title: 'Draft Post - Should Not Be Visible',
          content:
            'This is a draft post content. It needs to be long enough to pass validation.',
          status: 'draft',
        })
        .expect(201);

      const draftId = draftResponse.body.data.post.id;

      // Try to access as another user (no auth)
      const response = await request(app)
        .get(`/api/posts/${draftId}`)
        .expect(404);

      expectError(response, 'NOT_FOUND');
    });

    it('should show draft post to the author', async () => {
      // Create draft post
      const draftResponse = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${authUser.accessToken}`)
        .send({
          title: 'Draft Post - Visible to Author',
          content:
            'This is a draft post content. It needs to be long enough to pass validation.',
          status: 'draft',
        })
        .expect(201);

      const draftId = draftResponse.body.data.post.id;

      // Access as author
      const response = await request(app)
        .get(`/api/posts/${draftId}`)
        .set('Authorization', `Bearer ${authUser.accessToken}`)
        .expect(200);

      const data = expectSuccess(response);
      expect(data.post.id).toBe(draftId);
    });
  });

  describe('PUT /api/posts/:id', () => {
    let postId: string;

    beforeEach(async () => {
      const createResponse = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${authUser.accessToken}`)
        .send({
          title: 'Post to Update - Testing Updates',
          content:
            'Original content of the post. It needs to be long enough to pass validation.',
        })
        .expect(201);

      postId = createResponse.body.data.post.id;
    });

    it('should update a post successfully', async () => {
      const response = await request(app)
        .put(`/api/posts/${postId}`)
        .set('Authorization', `Bearer ${authUser.accessToken}`)
        .send({
          title: 'Updated Post Title - New Version',
          content:
            'Updated content of the post. It still needs to be long enough to pass validation.',
        })
        .expect(200);

      const data = expectSuccess(response);
      expect(data.post.title).toBe('Updated Post Title - New Version');
      expect(data.post.content).toContain('Updated content');
    });

    it('should reject update from non-author', async () => {
      const otherUser = await createAuthenticatedUser(app, {
        email: 'other@example.com',
        username: 'otheruser',
      });

      const response = await request(app)
        .put(`/api/posts/${postId}`)
        .set('Authorization', `Bearer ${otherUser.accessToken}`)
        .send({
          title: 'Trying to Update Someone Else Post',
          content: 'This should not work because I am not the author.',
        })
        .expect(403);

      expectError(response);
    });

    it('should reject update without authentication', async () => {
      const response = await request(app)
        .put(`/api/posts/${postId}`)
        .send({
          title: 'Updated Title',
          content: 'Updated content',
        })
        .expect(401);

      expectError(response, 'UNAUTHORIZED');
    });
  });

  describe('DELETE /api/posts/:id', () => {
    let postId: string;

    beforeEach(async () => {
      const createResponse = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${authUser.accessToken}`)
        .send({
          title: 'Post to Delete - Testing Deletion',
          content:
            'This post will be deleted. It needs to be long enough to pass validation.',
        })
        .expect(201);

      postId = createResponse.body.data.post.id;
    });

    it('should delete a post successfully', async () => {
      const response = await request(app)
        .delete(`/api/posts/${postId}`)
        .set('Authorization', `Bearer ${authUser.accessToken}`)
        .expect(200);

      const data = expectSuccess(response);
      expect(data.message).toBeDefined();

      // Verify post is deleted
      await request(app).get(`/api/posts/${postId}`).expect(404);
    });

    it('should reject delete from non-author', async () => {
      const otherUser = await createAuthenticatedUser(app, {
        email: 'other2@example.com',
        username: 'otheruser2',
      });

      const response = await request(app)
        .delete(`/api/posts/${postId}`)
        .set('Authorization', `Bearer ${otherUser.accessToken}`)
        .expect(403);

      expectError(response);
    });

    it('should return 404 for non-existent post', async () => {
      const response = await request(app)
        .delete('/api/posts/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${authUser.accessToken}`)
        .expect(404);

      expectError(response, 'NOT_FOUND');
    });
  });

  describe('GET /api/posts', () => {
    beforeEach(async () => {
      // Create multiple published posts
      for (let i = 1; i <= 5; i++) {
        await request(app)
          .post('/api/posts')
          .set('Authorization', `Bearer ${authUser.accessToken}`)
          .send({
            title: `Test Post Number ${i} for Listing`,
            content: `This is the content of test post ${i}. It needs to be long enough to pass validation.`,
            status: 'published',
          })
          .expect(201);
      }
    });

    it('should list published posts', async () => {
      const response = await request(app).get('/api/posts').expect(200);

      const data = expectSuccess(response);
      expect(data.posts).toBeDefined();
      expect(data.posts.length).toBe(5);
      expect(data.pagination).toBeDefined();
      expect(data.pagination.total).toBe(5);
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/posts?limit=2&page=1')
        .expect(200);

      const data = expectSuccess(response);
      expect(data.posts.length).toBe(2);
      expect(data.pagination.page).toBe(1);
      expect(data.pagination.limit).toBe(2);
      expect(data.pagination.total).toBe(5);
    });

    it('should filter by author', async () => {
      const response = await request(app)
        .get(`/api/posts?authorId=${authUser.userId}`)
        .expect(200);

      const data = expectSuccess(response);
      expect(data.posts.length).toBe(5);
      data.posts.forEach((post: { authorId: string }) => {
        expect(post.authorId).toBe(authUser.userId);
      });
    });

    it('should search posts by query', async () => {
      const response = await request(app)
        .get('/api/posts?query=Number%203')
        .expect(200);

      const data = expectSuccess(response);
      // Should find the post with "Number 3" in title
      expect(data.posts.length).toBeGreaterThanOrEqual(1);
    });

    it('should not list draft posts', async () => {
      // Create a draft post
      await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${authUser.accessToken}`)
        .send({
          title: 'Draft Post Should Not Appear in List',
          content: 'This is a draft post content. It needs to be long enough.',
          status: 'draft',
        })
        .expect(201);

      const response = await request(app).get('/api/posts').expect(200);

      const data = expectSuccess(response);
      // Should still be 5 (drafts not counted)
      expect(data.posts.length).toBe(5);
    });
  });

  describe('Complete Post Lifecycle', () => {
    it('should handle create → update → publish → delete', async () => {
      // 1. Create draft
      const createResponse = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${authUser.accessToken}`)
        .send({
          title: 'Lifecycle Test Post - Draft Stage',
          content: 'Initial draft content for the lifecycle test.',
          status: 'draft',
        })
        .expect(201);

      const postId = createResponse.body.data.post.id;
      expect(createResponse.body.data.post.status).toBe('draft');

      // 2. Update content
      const updateResponse = await request(app)
        .put(`/api/posts/${postId}`)
        .set('Authorization', `Bearer ${authUser.accessToken}`)
        .send({
          title: 'Lifecycle Test Post - Ready for Publish',
          content: 'Updated content ready for publishing now.',
        })
        .expect(200);

      expect(updateResponse.body.data.post.title).toContain(
        'Ready for Publish'
      );

      // 3. Publish
      const publishResponse = await request(app)
        .put(`/api/posts/${postId}`)
        .set('Authorization', `Bearer ${authUser.accessToken}`)
        .send({
          status: 'published',
        })
        .expect(200);

      expect(publishResponse.body.data.post.status).toBe('published');

      // 4. Verify public access
      const getResponse = await request(app)
        .get(`/api/posts/${postId}`)
        .expect(200);

      expect(getResponse.body.data.post.status).toBe('published');

      // 5. Delete
      await request(app)
        .delete(`/api/posts/${postId}`)
        .set('Authorization', `Bearer ${authUser.accessToken}`)
        .expect(200);

      // 6. Verify deleted
      await request(app).get(`/api/posts/${postId}`).expect(404);
    });
  });
});
