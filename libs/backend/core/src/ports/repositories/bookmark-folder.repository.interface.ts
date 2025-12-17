import type { BookmarkFolderEntity } from '@blog/shared/domain';

/**
 * Bookmark Folder Repository Interface (Port)
 *
 * Defines the contract for bookmark folder persistence operations.
 */
export interface IBookmarkFolderRepository {
  /**
   * Find folder by ID
   */
  findById(id: string): Promise<BookmarkFolderEntity | null>;

  /**
   * Find all folders for a user (ordered by sortOrder)
   */
  findByUserId(userId: string): Promise<BookmarkFolderEntity[]>;

  /**
   * Find the default folder for a user
   */
  findDefaultFolder(userId: string): Promise<BookmarkFolderEntity | null>;

  /**
   * Check if folder name exists for user (case-insensitive)
   */
  existsByUserIdAndName(userId: string, name: string): Promise<boolean>;

  /**
   * Save folder (create)
   */
  save(folder: BookmarkFolderEntity): Promise<void>;

  /**
   * Update folder
   */
  update(folder: BookmarkFolderEntity): Promise<void>;

  /**
   * Delete folder by ID
   */
  delete(id: string): Promise<void>;

  /**
   * Count folders for a user
   */
  countByUserId(userId: string): Promise<number>;
}
