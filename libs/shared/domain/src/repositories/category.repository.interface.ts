import type { CategoryEntity } from '../entities/category.entity.js';

/**
 * Category Repository Interface (Port)
 *
 * Defines the contract for category persistence operations.
 */
export interface ICategoryRepository {
  /**
   * Find category by ID
   */
  findById(id: string): Promise<CategoryEntity | null>;

  /**
   * Find category by slug
   */
  findBySlug(slug: string): Promise<CategoryEntity | null>;

  /**
   * Find all categories
   */
  findAll(options?: CategoryQueryOptions): Promise<CategoryEntity[]>;

  /**
   * Find root categories (no parent)
   */
  findRoots(): Promise<CategoryEntity[]>;

  /**
   * Find children of a category
   */
  findChildren(parentId: string): Promise<CategoryEntity[]>;

  /**
   * Find category tree (hierarchical structure)
   */
  findTree(): Promise<CategoryEntity[]>;

  /**
   * Save category (create or update)
   */
  save(category: CategoryEntity): Promise<void>;

  /**
   * Delete category
   * @throws Error if category has posts
   */
  delete(id: string): Promise<void>;

  /**
   * Check if slug exists
   */
  slugExists(slug: string, excludeId?: string): Promise<boolean>;

  /**
   * Check if category has children
   */
  hasChildren(id: string): Promise<boolean>;

  /**
   * Check if category has posts
   */
  hasPosts(id: string): Promise<boolean>;

  /**
   * Find categories by IDs
   */
  findByIds(ids: string[]): Promise<CategoryEntity[]>;

  /**
   * Reorder categories
   */
  reorder(orders: { id: string; sortOrder: number }[]): Promise<void>;

  /**
   * Count total categories
   */
  count(): Promise<number>;
}

/**
 * Category Query Options
 */
export interface CategoryQueryOptions {
  includeInactive?: boolean;
  parentId?: string | null; // null for roots only
  orderBy?: 'name' | 'sortOrder' | 'postCount' | 'createdAt';
  orderDir?: 'asc' | 'desc';
}
