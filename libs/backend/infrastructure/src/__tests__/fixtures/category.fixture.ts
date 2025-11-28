/**
 * Category Test Fixtures
 *
 * Factory functions for creating test category entities.
 */

import { CategoryEntity } from '@blog/shared/domain';

let categoryCounter = 0;

/**
 * Options for creating a test category
 */
export interface CreateTestCategoryOptions {
  name?: string;
  slug?: string;
  description?: string | null;
  parentId?: string | null;
  postCount?: number;
  sortOrder?: number;
  isActive?: boolean;
}

/**
 * Create a test category entity with optional overrides
 */
export function createTestCategory(
  options: CreateTestCategoryOptions = {}
): CategoryEntity {
  categoryCounter++;
  const uniqueSuffix = `${Date.now()}_${categoryCounter}`;

  return CategoryEntity.create({
    name: options.name ?? `Test Category ${uniqueSuffix}`,
    slug: options.slug,
    description:
      options.description ?? `Description for category ${uniqueSuffix}`,
    parentId: options.parentId ?? null,
    sortOrder: options.sortOrder ?? 0,
  });
}

/**
 * Create a root category (no parent)
 */
export function createTestRootCategory(
  options: CreateTestCategoryOptions = {}
): CategoryEntity {
  return createTestCategory({
    ...options,
    parentId: null,
  });
}

/**
 * Create a child category
 */
export function createTestChildCategory(
  parentId: string,
  options: CreateTestCategoryOptions = {}
): CategoryEntity {
  return createTestCategory({
    ...options,
    parentId,
  });
}

/**
 * Create a category hierarchy (parent -> child -> grandchild)
 */
export function createTestCategoryHierarchy(): {
  root: CategoryEntity;
  child: CategoryEntity;
  grandchild: CategoryEntity;
} {
  const root = createTestRootCategory({ name: 'Root Category' });
  const child = createTestChildCategory(root.id, { name: 'Child Category' });
  const grandchild = createTestChildCategory(child.id, {
    name: 'Grandchild Category',
  });

  return { root, child, grandchild };
}

/**
 * Create predefined categories (like seeded data)
 */
export function createPredefinedCategories(): CategoryEntity[] {
  return [
    createTestCategory({
      name: 'Technology',
      slug: 'technology',
      sortOrder: 1,
    }),
    createTestCategory({
      name: 'Programming',
      slug: 'programming',
      sortOrder: 2,
    }),
    createTestCategory({
      name: 'Web Development',
      slug: 'web-development',
      sortOrder: 3,
    }),
    createTestCategory({ name: 'DevOps', slug: 'devops', sortOrder: 4 }),
    createTestCategory({ name: 'Tutorials', slug: 'tutorials', sortOrder: 5 }),
  ];
}

/**
 * Create multiple test categories
 */
export function createTestCategories(
  count: number,
  options: CreateTestCategoryOptions = {}
): CategoryEntity[] {
  return Array.from({ length: count }, () => createTestCategory(options));
}

/**
 * Reset category counter
 */
export function resetCategoryCounter(): void {
  categoryCounter = 0;
}
