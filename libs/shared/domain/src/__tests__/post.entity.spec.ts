import { describe, it, expect, beforeEach } from '@jest/globals';
import { PostEntity, PostCreate } from '../entities/post.entity.js';

describe('PostEntity', () => {
  let validPostData: PostCreate;

  beforeEach(() => {
    validPostData = {
      authorId: crypto.randomUUID(),
      title: 'This is a valid test title',
      content:
        '<p>This is a valid content with more than 50 characters to pass validation rules.</p>',
    };
  });

  describe('create', () => {
    it('should create a valid post entity', () => {
      const post = PostEntity.create(validPostData);

      expect(post.id).toBeDefined();
      expect(post.title).toBe(validPostData.title);
      expect(post.slug).toBe('this-is-a-valid-test-title');
      expect(post.status).toBe('draft');
      expect(post.visibility).toBe('public');
    });

    it('should throw error for title too short', () => {
      const invalidData = { ...validPostData, title: 'Short' };

      expect(() => PostEntity.create(invalidData)).toThrow();
    });

    it('should throw error for title too long', () => {
      const invalidData = {
        ...validPostData,
        title: 'a'.repeat(201),
      };

      expect(() => PostEntity.create(invalidData)).toThrow();
    });

    it('should throw error for content too short', () => {
      const invalidData = { ...validPostData, content: 'Short' };

      expect(() => PostEntity.create(invalidData)).toThrow();
    });

    it('should auto-generate slug from title', () => {
      const data = {
        ...validPostData,
        title: 'Hello World! This is @#$ Test',
      };
      const post = PostEntity.create(data);

      expect(post.slug).toBe('hello-world-this-is-test');
    });

    it('should auto-generate excerpt from content', () => {
      const longContent = '<p>' + 'a'.repeat(300) + '</p>';
      const data = { ...validPostData, content: longContent };
      const post = PostEntity.create(data);

      const json = post.toJSON();
      expect(json.excerpt).toBeDefined();
      expect(json.excerpt!.length).toBeLessThanOrEqual(203); // 200 + '...'
    });

    it('should initialize counters to zero', () => {
      const post = PostEntity.create(validPostData);
      const json = post.toJSON();

      expect(json.viewCount).toBe(0);
      expect(json.likeCount).toBe(0);
      expect(json.commentCount).toBe(0);
      expect(json.bookmarkCount).toBe(0);
    });
  });

  describe('status management', () => {
    it('should publish post', () => {
      const post = PostEntity.create(validPostData);

      expect(post.status).toBe('draft');
      expect(post.isPublished).toBe(false);

      post.publish();

      expect(post.status).toBe('published');
      expect(post.isPublished).toBe(true);
      expect(post.toJSON().publishedAt).toBeInstanceOf(Date);
    });

    it('should throw error when publishing already published post', () => {
      const post = PostEntity.create(validPostData);
      post.publish();

      expect(() => post.publish()).toThrow('Post is already published');
    });

    it('should unpublish post', () => {
      const post = PostEntity.create(validPostData);
      post.publish();

      post.unpublish();

      expect(post.status).toBe('draft');
      expect(post.isPublished).toBe(false);
    });

    it('should throw error when unpublishing non-published post', () => {
      const post = PostEntity.create(validPostData);

      expect(() => post.unpublish()).toThrow('Post is not published');
    });

    it('should archive post', () => {
      const post = PostEntity.create(validPostData);

      post.archive();

      expect(post.status).toBe('archived');
    });
  });

  describe('update', () => {
    it('should update title and regenerate slug', () => {
      const post = PostEntity.create(validPostData);
      const oldSlug = post.slug;

      post.update({ title: 'New Different Title' });

      expect(post.title).toBe('New Different Title');
      expect(post.slug).not.toBe(oldSlug);
      expect(post.slug).toBe('new-different-title');
    });

    it('should update content and regenerate excerpt', () => {
      const post = PostEntity.create(validPostData);

      const newContent = '<p>' + 'b'.repeat(300) + '</p>';
      post.update({ content: newContent });

      const json = post.toJSON();
      expect(json.excerpt).toContain('b');
    });

    it('should update without changing slug if title not changed', () => {
      const post = PostEntity.create(validPostData);
      const oldSlug = post.slug;

      post.update({
        content:
          'New content with more than fifty characters to pass validation',
      });

      expect(post.slug).toBe(oldSlug);
    });
  });

  describe('embedding', () => {
    it('should set embedding vector', () => {
      const post = PostEntity.create(validPostData);
      const embedding = new Array(1536).fill(0.5);

      post.setEmbedding(embedding);

      const json = post.toJSON();
      expect(json.embedding).toEqual(embedding);
    });

    it('should throw error for wrong dimension', () => {
      const post = PostEntity.create(validPostData);
      const wrongEmbedding = new Array(100).fill(0.5);

      expect(() => post.setEmbedding(wrongEmbedding)).toThrow(
        'Embedding must be 1536 dimensions'
      );
    });
  });

  describe('counters', () => {
    it('should increment view count', () => {
      const post = PostEntity.create(validPostData);

      post.incrementViewCount();
      post.incrementViewCount();

      expect(post.toJSON().viewCount).toBe(2);
    });

    it('should increment and decrement like count', () => {
      const post = PostEntity.create(validPostData);

      post.incrementLikeCount();
      post.incrementLikeCount();
      expect(post.toJSON().likeCount).toBe(2);

      post.decrementLikeCount();
      expect(post.toJSON().likeCount).toBe(1);
    });

    it('should not go below zero when decrementing', () => {
      const post = PostEntity.create(validPostData);

      post.decrementLikeCount();
      post.decrementLikeCount();

      expect(post.toJSON().likeCount).toBe(0);
    });

    it('should increment and decrement comment count', () => {
      const post = PostEntity.create(validPostData);

      post.incrementCommentCount();
      post.incrementCommentCount();
      expect(post.toJSON().commentCount).toBe(2);

      post.decrementCommentCount();
      expect(post.toJSON().commentCount).toBe(1);
    });
  });

  describe('soft delete', () => {
    it('should soft delete post', () => {
      const post = PostEntity.create(validPostData);

      post.softDelete();

      const json = post.toJSON();
      expect(json.deletedAt).toBeInstanceOf(Date);
    });
  });

  describe('static helpers', () => {
    it('should generate valid slug', () => {
      const slug1 = PostEntity.generateSlug('Hello World');
      expect(slug1).toBe('hello-world');

      const slug2 = PostEntity.generateSlug('React Hooks Tutorial!!!');
      expect(slug2).toBe('react-hooks-tutorial');

      const slug3 = PostEntity.generateSlug('  Multiple   Spaces  ');
      expect(slug3).toBe('multiple-spaces');
    });

    it('should generate excerpt from HTML', () => {
      const html =
        '<p>This is a <strong>test</strong> with <em>HTML tags</em>.</p>';
      const excerpt = PostEntity.generateExcerpt(html);

      expect(excerpt).not.toContain('<p>');
      expect(excerpt).not.toContain('<strong>');
      expect(excerpt).toBe('This is a test with HTML tags.');
    });

    it('should truncate long content', () => {
      const longContent = 'a'.repeat(300);
      const excerpt = PostEntity.generateExcerpt(longContent, 50);

      expect(excerpt.length).toBe(50); // maxLength includes '...'
      expect(excerpt).toMatch(/\.\.\.$/);
    });
  });

  describe('serialization', () => {
    it('should serialize to JSON', () => {
      const post = PostEntity.create(validPostData);
      const json = post.toJSON();

      expect(json).toHaveProperty('id');
      expect(json).toHaveProperty('title');
      expect(json).toHaveProperty('content');
      expect(json).toHaveProperty('createdAt');
    });

    it('should serialize to summary', () => {
      const post = PostEntity.create(validPostData);
      const summary = post.toSummary();

      expect(summary).toHaveProperty('id');
      expect(summary).toHaveProperty('title');
      expect(summary).toHaveProperty('excerpt');
      expect(summary).toHaveProperty('viewCount');
      expect(summary).not.toHaveProperty('content'); // Full content excluded
    });
  });
});
