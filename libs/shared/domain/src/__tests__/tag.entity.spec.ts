import { describe, it, expect, beforeEach } from '@jest/globals';
import { TagEntity, TagCreate } from '../entities/tag.entity.js';

describe('TagEntity', () => {
  let validTagData: TagCreate;

  beforeEach(() => {
    validTagData = {
      name: 'JavaScript',
    };
  });

  describe('create', () => {
    it('should create a valid tag entity', () => {
      const tag = TagEntity.create(validTagData);

      expect(tag.id).toBeDefined();
      expect(tag.name).toBe('JavaScript');
      expect(tag.slug).toBe('javascript');
      expect(tag.usageCount).toBe(0);
    });

    it('should generate slug from name', () => {
      const tag = TagEntity.create({ name: 'React Hooks' });

      expect(tag.slug).toBe('react-hooks');
    });

    it('should use provided slug', () => {
      const tag = TagEntity.create({
        name: 'React Hooks',
        slug: 'react-hooks-tutorial',
      });

      expect(tag.slug).toBe('react-hooks-tutorial');
    });

    it('should throw error for name too short', () => {
      expect(() => TagEntity.create({ name: 'A' })).toThrow();
    });

    it('should throw error for name too long', () => {
      expect(() => TagEntity.create({ name: 'a'.repeat(31) })).toThrow();
    });
  });

  describe('business rules', () => {
    describe('canBeDeleted', () => {
      it('should return true when not used', () => {
        const tag = TagEntity.create(validTagData);

        expect(tag.canBeDeleted()).toBe(true);
      });

      it('should return false when in use', () => {
        const tag = TagEntity.create(validTagData);
        tag.incrementUsageCount();

        expect(tag.canBeDeleted()).toBe(false);
      });
    });

    describe('isTrending', () => {
      it('should return false when below threshold', () => {
        const tag = TagEntity.create(validTagData);

        expect(tag.isTrending()).toBe(false);
      });

      it('should return true when at threshold', () => {
        const tag = TagEntity.create(validTagData);
        for (let i = 0; i < 10; i++) {
          tag.incrementUsageCount();
        }

        expect(tag.isTrending()).toBe(true);
      });

      it('should use custom threshold', () => {
        const tag = TagEntity.create(validTagData);
        for (let i = 0; i < 5; i++) {
          tag.incrementUsageCount();
        }

        expect(tag.isTrending(5)).toBe(true);
        expect(tag.isTrending(10)).toBe(false);
      });
    });
  });

  describe('static helpers', () => {
    describe('normalize', () => {
      it('should normalize tag name', () => {
        expect(TagEntity.normalize('JavaScript')).toBe('javascript');
        expect(TagEntity.normalize('  React  ')).toBe('react');
      });
    });

    describe('areEquivalent', () => {
      it('should return true for equivalent names', () => {
        expect(TagEntity.areEquivalent('JavaScript', 'javascript')).toBe(true);
        expect(TagEntity.areEquivalent('REACT', 'react')).toBe(true);
      });

      it('should return false for different names', () => {
        expect(TagEntity.areEquivalent('JavaScript', 'TypeScript')).toBe(false);
      });
    });
  });

  describe('mutations', () => {
    it('should update name and regenerate slug', () => {
      const tag = TagEntity.create(validTagData);

      tag.update({ name: 'TypeScript' });

      expect(tag.name).toBe('TypeScript');
      expect(tag.slug).toBe('typescript');
    });

    it('should rename tag', () => {
      const tag = TagEntity.create(validTagData);

      tag.rename('Vue.js');

      expect(tag.name).toBe('Vue.js');
      expect(tag.slug).toBe('vuejs');
    });

    it('should increment and decrement usage count', () => {
      const tag = TagEntity.create(validTagData);

      tag.incrementUsageCount();
      tag.incrementUsageCount();
      expect(tag.usageCount).toBe(2);

      tag.decrementUsageCount();
      expect(tag.usageCount).toBe(1);
    });

    it('should not go below zero when decrementing', () => {
      const tag = TagEntity.create(validTagData);

      tag.decrementUsageCount();

      expect(tag.usageCount).toBe(0);
    });
  });

  describe('serialization', () => {
    it('should serialize to JSON', () => {
      const tag = TagEntity.create(validTagData);
      const json = tag.toJSON();

      expect(json).toHaveProperty('id');
      expect(json).toHaveProperty('name');
      expect(json).toHaveProperty('slug');
      expect(json).toHaveProperty('usageCount');
      expect(json).toHaveProperty('createdAt');
    });

    it('should serialize to option', () => {
      const tag = TagEntity.create(validTagData);
      const option = tag.toOption();

      expect(option).toHaveProperty('value');
      expect(option).toHaveProperty('label');
      expect(option.label).toBe('JavaScript');
    });

    it('should serialize to cloud item', () => {
      const tag = TagEntity.create(validTagData);
      tag.incrementUsageCount();
      const cloudItem = tag.toCloudItem();

      expect(cloudItem).toHaveProperty('name');
      expect(cloudItem).toHaveProperty('slug');
      expect(cloudItem).toHaveProperty('count');
      expect(cloudItem.count).toBe(1);
    });
  });
});
