import { describe, it, expect, beforeEach } from '@jest/globals';
import { CategoryEntity, CategoryCreate } from '../entities/category.entity.js';

describe('CategoryEntity', () => {
  let validCategoryData: CategoryCreate;

  beforeEach(() => {
    validCategoryData = {
      name: 'Technology',
      description: 'Tech related posts',
    };
  });

  describe('create', () => {
    it('should create a valid category entity', () => {
      const category = CategoryEntity.create(validCategoryData);

      expect(category.id).toBeDefined();
      expect(category.name).toBe('Technology');
      expect(category.slug).toBe('technology');
      expect(category.description).toBe('Tech related posts');
      expect(category.parentId).toBeNull();
      expect(category.postCount).toBe(0);
      expect(category.isActive).toBe(true);
    });

    it('should generate slug from name', () => {
      const category = CategoryEntity.create({ name: 'Web Development' });

      expect(category.slug).toBe('web-development');
    });

    it('should use provided slug', () => {
      const category = CategoryEntity.create({
        name: 'Web Development',
        slug: 'webdev',
      });

      expect(category.slug).toBe('webdev');
    });

    it('should allow parent category', () => {
      const parentId = crypto.randomUUID();
      const category = CategoryEntity.create({
        ...validCategoryData,
        parentId,
      });

      expect(category.parentId).toBe(parentId);
      expect(category.isRoot).toBe(false);
    });

    it('should throw error for name too short', () => {
      expect(() => CategoryEntity.create({ name: 'A' })).toThrow();
    });

    it('should throw error for name too long', () => {
      expect(() => CategoryEntity.create({ name: 'a'.repeat(51) })).toThrow();
    });
  });

  describe('business rules', () => {
    describe('canBeDeleted', () => {
      it('should return true when no posts', () => {
        const category = CategoryEntity.create(validCategoryData);

        expect(category.canBeDeleted()).toBe(true);
      });

      it('should return false when has posts', () => {
        const category = CategoryEntity.create(validCategoryData);
        category.incrementPostCount();

        expect(category.canBeDeleted()).toBe(false);
      });
    });

    describe('isDisplayable', () => {
      it('should return false when inactive', () => {
        const category = CategoryEntity.create(validCategoryData);
        category.deactivate();

        expect(category.isDisplayable()).toBe(false);
      });

      it('should return false when no posts', () => {
        const category = CategoryEntity.create(validCategoryData);

        expect(category.isDisplayable()).toBe(false);
      });

      it('should return true when active with posts', () => {
        const category = CategoryEntity.create(validCategoryData);
        category.incrementPostCount();

        expect(category.isDisplayable()).toBe(true);
      });
    });

    describe('isRoot', () => {
      it('should return true when no parent', () => {
        const category = CategoryEntity.create(validCategoryData);

        expect(category.isRoot).toBe(true);
      });

      it('should return false when has parent', () => {
        const category = CategoryEntity.create({
          ...validCategoryData,
          parentId: crypto.randomUUID(),
        });

        expect(category.isRoot).toBe(false);
      });
    });
  });

  describe('mutations', () => {
    it('should update name and regenerate slug', () => {
      const category = CategoryEntity.create(validCategoryData);

      category.update({ name: 'Programming' });

      expect(category.name).toBe('Programming');
      expect(category.slug).toBe('programming');
    });

    it('should activate category', () => {
      const category = CategoryEntity.create(validCategoryData);
      category.deactivate();

      category.activate();

      expect(category.isActive).toBe(true);
    });

    it('should deactivate category', () => {
      const category = CategoryEntity.create(validCategoryData);

      category.deactivate();

      expect(category.isActive).toBe(false);
    });

    it('should move to different parent', () => {
      const category = CategoryEntity.create(validCategoryData);
      const newParentId = crypto.randomUUID();

      category.moveTo(newParentId);

      expect(category.parentId).toBe(newParentId);
    });

    it('should throw error when moving to self', () => {
      const category = CategoryEntity.create(validCategoryData);

      expect(() => category.moveTo(category.id)).toThrow(
        'Category cannot be its own parent'
      );
    });

    it('should increment and decrement post count', () => {
      const category = CategoryEntity.create(validCategoryData);

      category.incrementPostCount();
      category.incrementPostCount();
      expect(category.postCount).toBe(2);

      category.decrementPostCount();
      expect(category.postCount).toBe(1);
    });

    it('should not go below zero when decrementing', () => {
      const category = CategoryEntity.create(validCategoryData);

      category.decrementPostCount();

      expect(category.postCount).toBe(0);
    });
  });

  describe('serialization', () => {
    it('should serialize to JSON', () => {
      const category = CategoryEntity.create(validCategoryData);
      const json = category.toJSON();

      expect(json).toHaveProperty('id');
      expect(json).toHaveProperty('name');
      expect(json).toHaveProperty('slug');
      expect(json).toHaveProperty('createdAt');
    });

    it('should serialize to tree node', () => {
      const category = CategoryEntity.create(validCategoryData);
      const node = category.toTreeNode();

      expect(node).toHaveProperty('id');
      expect(node).toHaveProperty('name');
      expect(node).toHaveProperty('slug');
      expect(node).toHaveProperty('postCount');
      expect(node).toHaveProperty('children');
      expect(node.children).toEqual([]);
    });

    it('should serialize to option', () => {
      const category = CategoryEntity.create(validCategoryData);
      const option = category.toOption();

      expect(option).toHaveProperty('value');
      expect(option).toHaveProperty('label');
      expect(option.label).toBe('Technology');
    });
  });
});
