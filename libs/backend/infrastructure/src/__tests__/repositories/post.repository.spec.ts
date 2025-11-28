/**
 * Post Repository Integration Tests
 *
 * Tests PostgresPostRepository with real database operations.
 */

import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
} from '@jest/globals';
import { Kysely } from 'kysely';
import type { Database } from '../../database/types.js';
import { PostgresPostRepository } from '../../repositories/post.repository.js';
import { PostgresUserRepository } from '../../repositories/user.repository.js';
import { PostStatus, PostVisibility } from '@blog/shared/domain';
import {
  startTestDatabase,
  stopTestDatabase,
  cleanDatabase,
} from '../test-database.js';
import {
  createTestUser,
  createTestPost,
  createTestPublishedPost,
  createTestDraftPost,
  resetPostCounter,
} from '../fixtures/index.js';

describe('PostgresPostRepository', () => {
  let db: Kysely<Database>;
  let postRepository: PostgresPostRepository;
  let userRepository: PostgresUserRepository;
  let testUserId: string;

  beforeAll(async () => {
    const result = await startTestDatabase();
    db = result.db;
    postRepository = new PostgresPostRepository(db);
    userRepository = new PostgresUserRepository(db);
  }, 60000);

  afterAll(async () => {
    await stopTestDatabase();
  });

  beforeEach(async () => {
    await cleanDatabase(db);
    resetPostCounter();

    // Create a test user for posts
    const testUser = createTestUser({
      email: 'author@example.com',
      username: 'author',
    });
    await userRepository.save(testUser);
    testUserId = testUser.id;
  });

  describe('save', () => {
    it('should save a new post', async () => {
      // Arrange
      const post = createTestPost({ authorId: testUserId });

      // Act
      await postRepository.save(post);

      // Assert
      const found = await postRepository.findById(post.id);
      expect(found).not.toBeNull();
      expect(found?.id).toBe(post.id);
      expect(found?.title).toBe(post.title);
      expect(found?.authorId).toBe(testUserId);
    });

    it('should update an existing post', async () => {
      // Arrange
      const post = createTestPost({ authorId: testUserId });
      await postRepository.save(post);

      // Modify post
      post.update({
        title: 'Updated Title - This is now changed and long enough',
      });

      // Act
      await postRepository.save(post);

      // Assert
      const found = await postRepository.findById(post.id);
      expect(found?.title).toBe(
        'Updated Title - This is now changed and long enough'
      );
    });
  });

  describe('findById', () => {
    it('should return null for non-existent post', async () => {
      const result = await postRepository.findById(crypto.randomUUID());
      expect(result).toBeNull();
    });

    it('should find post by id', async () => {
      const post = createTestPost({ authorId: testUserId });
      await postRepository.save(post);

      const found = await postRepository.findById(post.id);
      expect(found).not.toBeNull();
      expect(found?.id).toBe(post.id);
    });

    it('should not find soft-deleted post', async () => {
      const post = createTestPost({ authorId: testUserId });
      await postRepository.save(post);
      await postRepository.softDelete(post.id);

      const found = await postRepository.findById(post.id);
      expect(found).toBeNull();
    });
  });

  describe('findBySlug', () => {
    it('should return null for non-existent slug', async () => {
      const result = await postRepository.findBySlug('non-existent-slug');
      expect(result).toBeNull();
    });

    it('should find post by slug', async () => {
      const post = createTestPost({
        authorId: testUserId,
        title: 'My Unique Post Title For Testing',
      });
      await postRepository.save(post);

      const found = await postRepository.findBySlug(post.slug);
      expect(found).not.toBeNull();
      expect(found?.slug).toBe(post.slug);
    });
  });

  describe('findByAuthorId', () => {
    it('should return empty array for author with no posts', async () => {
      const result = await postRepository.findByAuthorId(crypto.randomUUID());
      expect(result).toEqual([]);
    });

    it('should find all posts by author', async () => {
      const post1 = createTestPost({ authorId: testUserId });
      const post2 = createTestPost({ authorId: testUserId });
      await postRepository.save(post1);
      await postRepository.save(post2);

      const posts = await postRepository.findByAuthorId(testUserId);
      expect(posts).toHaveLength(2);
    });

    it('should filter by status', async () => {
      const draftPost = createTestDraftPost({ authorId: testUserId });
      const publishedPost = createTestPublishedPost({ authorId: testUserId });
      await postRepository.save(draftPost);
      await postRepository.save(publishedPost);

      const drafts = await postRepository.findByAuthorId(testUserId, {
        status: 'draft',
      });
      expect(drafts).toHaveLength(1);
      expect(drafts[0].status).toBe(PostStatus.DRAFT);
    });

    it('should respect pagination', async () => {
      // Create 5 posts
      for (let i = 0; i < 5; i++) {
        await postRepository.save(createTestPost({ authorId: testUserId }));
      }

      const page1 = await postRepository.findByAuthorId(testUserId, {
        limit: 2,
        offset: 0,
      });
      const page2 = await postRepository.findByAuthorId(testUserId, {
        limit: 2,
        offset: 2,
      });

      expect(page1).toHaveLength(2);
      expect(page2).toHaveLength(2);
      // Ensure different posts
      expect(page1[0].id).not.toBe(page2[0].id);
    });

    it('should order by specified field', async () => {
      const post1 = createTestPost({ authorId: testUserId });
      const post2 = createTestPost({ authorId: testUserId });
      await postRepository.save(post1);
      await postRepository.save(post2);

      const postsAsc = await postRepository.findByAuthorId(testUserId, {
        orderBy: 'createdAt',
        orderDir: 'asc',
      });

      expect(postsAsc[0].id).toBe(post1.id);
      expect(postsAsc[1].id).toBe(post2.id);
    });
  });

  describe('findPublished', () => {
    it('should only return published public posts', async () => {
      const draftPost = createTestDraftPost({ authorId: testUserId });
      const publishedPost = createTestPublishedPost({ authorId: testUserId });
      const privatePost = createTestPost({
        authorId: testUserId,
        status: 'published',
        visibility: 'private',
      });
      privatePost.publish();

      await postRepository.save(draftPost);
      await postRepository.save(publishedPost);
      await postRepository.save(privatePost);

      const published = await postRepository.findPublished();
      expect(published).toHaveLength(1);
      expect(published[0].id).toBe(publishedPost.id);
    });

    it('should order by publishedAt desc by default', async () => {
      const post1 = createTestPublishedPost({ authorId: testUserId });
      await new Promise((resolve) => setTimeout(resolve, 10)); // Small delay
      const post2 = createTestPublishedPost({ authorId: testUserId });

      await postRepository.save(post1);
      await postRepository.save(post2);

      const published = await postRepository.findPublished();
      expect(published[0].id).toBe(post2.id); // Most recent first
    });
  });

  describe('searchFullText', () => {
    beforeEach(async () => {
      // Create posts with searchable content
      const post1 = createTestPost({
        authorId: testUserId,
        title: 'Introduction to TypeScript Programming',
        content:
          'TypeScript is a typed superset of JavaScript. ' + 'a'.repeat(100),
        status: 'published',
      });
      post1.publish();

      const post2 = createTestPost({
        authorId: testUserId,
        title: 'Getting Started with React Framework',
        content: 'React is a popular JavaScript library. ' + 'b'.repeat(100),
        status: 'published',
      });
      post2.publish();

      const post3 = createTestPost({
        authorId: testUserId,
        title: 'Docker Container Basics',
        content: 'Docker makes deployment easy. ' + 'c'.repeat(100),
        status: 'published',
      });
      post3.publish();

      await postRepository.save(post1);
      await postRepository.save(post2);
      await postRepository.save(post3);
    });

    it('should find posts matching title', async () => {
      const results = await postRepository.searchFullText('TypeScript');
      expect(results).toHaveLength(1);
      expect(results[0].title).toContain('TypeScript');
    });

    it('should find posts matching content', async () => {
      const results = await postRepository.searchFullText('JavaScript');
      expect(results).toHaveLength(2); // Both TypeScript and React posts
    });

    it('should return empty array for no matches', async () => {
      const results = await postRepository.searchFullText('Kubernetes');
      expect(results).toHaveLength(0);
    });

    it('should respect limit option', async () => {
      const results = await postRepository.searchFullText('JavaScript', {
        limit: 1,
      });
      expect(results).toHaveLength(1);
    });
  });

  describe('slugExists', () => {
    it('should return false for non-existent slug', async () => {
      const exists = await postRepository.slugExists('non-existent-slug');
      expect(exists).toBe(false);
    });

    it('should return true for existing slug', async () => {
      const post = createTestPost({ authorId: testUserId });
      await postRepository.save(post);

      const exists = await postRepository.slugExists(post.slug);
      expect(exists).toBe(true);
    });

    it('should exclude specified post id', async () => {
      const post = createTestPost({ authorId: testUserId });
      await postRepository.save(post);

      // Same slug should not exist when excluding this post
      const exists = await postRepository.slugExists(post.slug, post.id);
      expect(exists).toBe(false);
    });
  });

  describe('countByStatus', () => {
    it('should return 0 for no posts', async () => {
      const count = await postRepository.countByStatus('draft');
      expect(count).toBe(0);
    });

    it('should count posts by status', async () => {
      await postRepository.save(createTestDraftPost({ authorId: testUserId }));
      await postRepository.save(createTestDraftPost({ authorId: testUserId }));
      await postRepository.save(
        createTestPublishedPost({ authorId: testUserId })
      );

      const draftCount = await postRepository.countByStatus('draft');
      const publishedCount = await postRepository.countByStatus('published');

      expect(draftCount).toBe(2);
      expect(publishedCount).toBe(1);
    });
  });

  describe('countByAuthor', () => {
    it('should return 0 for author with no posts', async () => {
      const count = await postRepository.countByAuthor(crypto.randomUUID());
      expect(count).toBe(0);
    });

    it('should count posts by author', async () => {
      await postRepository.save(createTestPost({ authorId: testUserId }));
      await postRepository.save(createTestPost({ authorId: testUserId }));

      const count = await postRepository.countByAuthor(testUserId);
      expect(count).toBe(2);
    });
  });

  describe('softDelete', () => {
    it('should soft delete a post', async () => {
      const post = createTestPost({ authorId: testUserId });
      await postRepository.save(post);

      await postRepository.softDelete(post.id);

      const found = await postRepository.findById(post.id);
      expect(found).toBeNull();
    });

    it('should not affect other posts', async () => {
      const post1 = createTestPost({ authorId: testUserId });
      const post2 = createTestPost({ authorId: testUserId });
      await postRepository.save(post1);
      await postRepository.save(post2);

      await postRepository.softDelete(post1.id);

      const found = await postRepository.findById(post2.id);
      expect(found).not.toBeNull();
    });
  });

  describe('findTrending', () => {
    it('should return posts ordered by engagement', async () => {
      // Create posts with different view counts
      const post1 = createTestPublishedPost({ authorId: testUserId });
      const post2 = createTestPublishedPost({ authorId: testUserId });
      const post3 = createTestPublishedPost({ authorId: testUserId });

      await postRepository.save(post1);
      await postRepository.save(post2);
      await postRepository.save(post3);

      // Update view counts directly in DB
      await db
        .updateTable('posts')
        .set({ view_count: 100 })
        .where('id', '=', post1.id)
        .execute();
      await db
        .updateTable('posts')
        .set({ view_count: 500 })
        .where('id', '=', post2.id)
        .execute();
      await db
        .updateTable('posts')
        .set({ view_count: 50 })
        .where('id', '=', post3.id)
        .execute();

      const trending = await postRepository.findTrending({ limit: 3 });

      expect(trending).toHaveLength(3);
      expect(trending[0].id).toBe(post2.id); // Highest views first
      expect(trending[1].id).toBe(post1.id);
      expect(trending[2].id).toBe(post3.id);
    });

    it('should filter by period', async () => {
      const recentPost = createTestPublishedPost({ authorId: testUserId });
      await postRepository.save(recentPost);

      // Create old post by updating published_at directly
      const oldPost = createTestPublishedPost({ authorId: testUserId });
      await postRepository.save(oldPost);
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 40); // 40 days ago
      await db
        .updateTable('posts')
        .set({ published_at: oldDate })
        .where('id', '=', oldPost.id)
        .execute();

      const trendingMonth = await postRepository.findTrending({
        period: 'month',
      });

      expect(trendingMonth).toHaveLength(1);
      expect(trendingMonth[0].id).toBe(recentPost.id);
    });
  });

  describe('findRelated', () => {
    it('should find related posts by same author', async () => {
      const post1 = createTestPublishedPost({ authorId: testUserId });
      const post2 = createTestPublishedPost({ authorId: testUserId });
      const post3 = createTestPublishedPost({ authorId: testUserId });

      await postRepository.save(post1);
      await postRepository.save(post2);
      await postRepository.save(post3);

      const related = await postRepository.findRelated(post1.id, 5);

      expect(related).toHaveLength(2);
      expect(related.map((p) => p.id)).not.toContain(post1.id);
    });

    it('should return empty for non-existent post', async () => {
      const related = await postRepository.findRelated(crypto.randomUUID());
      expect(related).toEqual([]);
    });
  });
});
