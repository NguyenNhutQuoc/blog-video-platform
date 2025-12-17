import type { BookmarkEntity } from '@blog/shared/domain';

/**
 * Bookmark Repository Interface (Port)
 *
 * Defines the contract for bookmark persistence operations.
 */
export interface IBookmarkRepository {
  /**
   * Find bookmark by ID
   */
  findById(id: string): Promise<BookmarkEntity | null>;

  /**
   * Find bookmark by user and post
   */
  findByUserAndPost(
    userId: string,
    postId: string
  ): Promise<BookmarkEntity | null>;

  /**
   * Check if user has bookmarked a post
   */
  isPostBookmarkedByUser(userId: string, postId: string): Promise<boolean>;

  /**
   * Bulk check if user has bookmarked multiple posts
   */
  isPostsBookmarkedByUser(
    userId: string,
    postIds: string[]
  ): Promise<Map<string, boolean>>;

  /**
   * Get all bookmarks for a user
   */
  findByUserId(
    userId: string,
    options?: BookmarkQueryOptions
  ): Promise<BookmarkEntity[]>;

  /**
   * Get all bookmarks in a folder
   */
  findByFolderId(
    folderId: string,
    options?: BookmarkQueryOptions
  ): Promise<BookmarkEntity[]>;

  /**
   * Count bookmarks for a user
   */
  countByUserId(userId: string): Promise<number>;

  /**
   * Count bookmarks in a folder
   */
  countByFolderId(folderId: string): Promise<number>;

  /**
   * Save bookmark (create)
   */
  save(bookmark: BookmarkEntity): Promise<void>;

  /**
   * Update bookmark
   */
  update(bookmark: BookmarkEntity): Promise<void>;

  /**
   * Delete bookmark by user and post
   */
  delete(userId: string, postId: string): Promise<void>;

  /**
   * Delete bookmark by ID
   */
  deleteById(id: string): Promise<void>;
}

/**
 * Bookmark Query Options
 */
export interface BookmarkQueryOptions {
  cursor?: string; // ISO timestamp for cursor pagination
  limit?: number;
  folderId?: string; // Optional folder filter
}
