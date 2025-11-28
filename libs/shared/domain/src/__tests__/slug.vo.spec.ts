import { describe, it, expect } from '@jest/globals';
import { Slug } from '../value-objects/slug.vo.js';

describe('Slug Value Object', () => {
  describe('create', () => {
    it('should create a valid slug', () => {
      const slug = Slug.create('my-awesome-post');

      expect(slug.getValue()).toBe('my-awesome-post');
    });

    it('should throw error for invalid slug format', () => {
      expect(() => Slug.create('My Slug')).toThrow();
      expect(() => Slug.create('slug_with_underscore')).toThrow();
      expect(() => Slug.create('UPPERCASE')).toThrow();
    });

    it('should throw error for slug with consecutive hyphens', () => {
      expect(() => Slug.create('my--slug')).toThrow();
    });

    it('should throw error for slug starting/ending with hyphen', () => {
      expect(() => Slug.create('-my-slug')).toThrow();
      expect(() => Slug.create('my-slug-')).toThrow();
    });

    it('should throw error for empty slug', () => {
      expect(() => Slug.create('')).toThrow();
    });
  });

  describe('fromText', () => {
    it('should generate slug from text', () => {
      const slug = Slug.fromText('Hello World');

      expect(slug.getValue()).toBe('hello-world');
    });

    it('should handle special characters', () => {
      const slug = Slug.fromText('Hello! @World# 2024');

      expect(slug.getValue()).toBe('hello-world-2024');
    });

    it('should handle multiple spaces', () => {
      const slug = Slug.fromText('  Multiple   Spaces  ');

      expect(slug.getValue()).toBe('multiple-spaces');
    });

    it('should handle empty result with timestamp', () => {
      const slug = Slug.fromText('!@#$%');

      expect(slug.getValue()).toMatch(/^post-\d+$/);
    });
  });

  describe('fromPersistence', () => {
    it('should create slug without validation', () => {
      const slug = Slug.fromPersistence('stored-slug');

      expect(slug.getValue()).toBe('stored-slug');
    });
  });

  describe('withSuffix', () => {
    it('should append numeric suffix', () => {
      const slug = Slug.create('my-post');
      const newSlug = slug.withSuffix(2);

      expect(newSlug.getValue()).toBe('my-post-2');
    });

    it('should append string suffix', () => {
      const slug = Slug.create('my-post');
      const newSlug = slug.withSuffix('v2');

      expect(newSlug.getValue()).toBe('my-post-v2');
    });
  });

  describe('makeUnique', () => {
    it('should append timestamp', () => {
      const slug = Slug.create('my-post');
      const uniqueSlug = slug.makeUnique();

      expect(uniqueSlug.getValue()).toMatch(/^my-post-[a-z0-9]+$/);
    });
  });

  describe('equals', () => {
    it('should return true for same slug', () => {
      const slug1 = Slug.create('my-post');
      const slug2 = Slug.create('my-post');

      expect(slug1.equals(slug2)).toBe(true);
    });

    it('should return false for different slug', () => {
      const slug1 = Slug.create('my-post-1');
      const slug2 = Slug.create('my-post-2');

      expect(slug1.equals(slug2)).toBe(false);
    });
  });

  describe('serialization', () => {
    it('should convert to string', () => {
      const slug = Slug.create('my-post');

      expect(slug.toString()).toBe('my-post');
    });

    it('should convert to JSON', () => {
      const slug = Slug.create('my-post');

      expect(slug.toJSON()).toBe('my-post');
    });
  });
});
