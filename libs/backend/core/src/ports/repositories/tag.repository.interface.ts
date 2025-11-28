import type { TagEntity } from '../entities/tag.entity.js';

/**
 * Tag Repository Interface (Port)
 *
 * Defines the contract for tag persistence operations.
 */
export interface ITagRepository {
  /**
   * Find tag by ID
   */
  findById(id: string): Promise<TagEntity | null>;

  /**
   * Find tag by slug
   */
  findBySlug(slug: string): Promise<TagEntity | null>;

  /**
   * Find tag by name (case-insensitive)
   */
  findByName(name: string): Promise<TagEntity | null>;

  /**
   * Find or create tag by name
   */
  findOrCreate(name: string): Promise<TagEntity>;

  /**
   * Find all tags
   */
  findAll(options?: TagQueryOptions): Promise<TagEntity[]>;

  /**
   * Find popular tags (sorted by usage)
   */
  findPopular(limit?: number): Promise<TagEntity[]>;

  /**
   * Find trending tags (recent usage growth)
   */
  findTrending(options?: TrendingTagOptions): Promise<TagEntity[]>;

  /**
   * Search tags by name (autocomplete)
   */
  search(query: string, limit?: number): Promise<TagEntity[]>;

  /**
   * Save tag (create or update)
   */
  save(tag: TagEntity): Promise<void>;

  /**
   * Delete tag
   * @throws Error if tag is in use
   */
  delete(id: string): Promise<void>;

  /**
   * Check if slug exists
   */
  slugExists(slug: string, excludeId?: string): Promise<boolean>;

  /**
   * Find tags by IDs
   */
  findByIds(ids: string[]): Promise<TagEntity[]>;

  /**
   * Find tags by post ID
   */
  findByPostId(postId: string): Promise<TagEntity[]>;

  /**
   * Merge tags (move all usage from source to target, delete source)
   */
  merge(sourceId: string, targetId: string): Promise<void>;

  /**
   * Count total tags
   */
  count(): Promise<number>;

  /**
   * Count unused tags
   */
  countUnused(): Promise<number>;

  /**
   * Delete unused tags (cleanup)
   */
  deleteUnused(): Promise<number>;
}

/**
 * Tag Query Options
 */
export interface TagQueryOptions {
  minUsageCount?: number;
  orderBy?: 'name' | 'usageCount' | 'createdAt';
  orderDir?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

/**
 * Trending Tag Options
 */
export interface TrendingTagOptions {
  period?: 'day' | 'week' | 'month';
  limit?: number;
}
