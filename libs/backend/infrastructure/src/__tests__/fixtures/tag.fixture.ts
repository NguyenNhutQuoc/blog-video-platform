/**
 * Tag Test Fixtures
 *
 * Factory functions for creating test tag entities.
 */

import { TagEntity } from '@blog/shared/domain';

let tagCounter = 0;

/**
 * Options for creating a test tag
 */
export interface CreateTestTagOptions {
  name?: string;
  slug?: string;
}

/**
 * Create a test tag entity with optional overrides
 */
export function createTestTag(options: CreateTestTagOptions = {}): TagEntity {
  tagCounter++;
  const uniqueSuffix = `${Date.now()}_${tagCounter}`;

  return TagEntity.create({
    name: options.name ?? `testtag${uniqueSuffix}`,
    slug: options.slug,
  });
}

/**
 * Create predefined tags (like seeded data)
 */
export function createPredefinedTags(): TagEntity[] {
  return [
    createTestTag({ name: 'javascript', slug: 'javascript' }),
    createTestTag({ name: 'typescript', slug: 'typescript' }),
    createTestTag({ name: 'nodejs', slug: 'nodejs' }),
    createTestTag({ name: 'react', slug: 'react' }),
    createTestTag({ name: 'nextjs', slug: 'nextjs' }),
    createTestTag({ name: 'docker', slug: 'docker' }),
    createTestTag({ name: 'postgresql', slug: 'postgresql' }),
    createTestTag({ name: 'testing', slug: 'testing' }),
  ];
}

/**
 * Create multiple test tags
 */
export function createTestTags(
  count: number,
  options: CreateTestTagOptions = {}
): TagEntity[] {
  return Array.from({ length: count }, () => createTestTag(options));
}

/**
 * Create tags with specific names (for search testing)
 */
export function createTestTagsWithNames(names: string[]): TagEntity[] {
  return names.map((name) => createTestTag({ name }));
}

/**
 * Reset tag counter
 */
export function resetTagCounter(): void {
  tagCounter = 0;
}
