import type { LikeEntity } from '@blog/shared/domain';

/**
 * Like Repository Interface (Port)
 *
 * Defines the contract for like persistence operations.
 */
export interface ILikeRepository {
  /**
   * Find like by ID
   */
  findById(id: string): Promise<LikeEntity | null>;

  /**
   * Find like by user and post
   */
  findByUserAndPost(userId: string, postId: string): Promise<LikeEntity | null>;

  /**
   * Check if user has liked a post
   */
  isPostLikedByUser(userId: string, postId: string): Promise<boolean>;

  /**
   * Bulk check if user has liked multiple posts
   */
  isPostsLikedByUser(
    userId: string,
    postIds: string[]
  ): Promise<Map<string, boolean>>;

  /**
   * Get all likes for a post
   */
  findByPostId(
    postId: string,
    options?: LikeQueryOptions
  ): Promise<LikeEntity[]>;

  /**
   * Get all likes by a user
   */
  findByUserId(
    userId: string,
    options?: LikeQueryOptions
  ): Promise<LikeEntity[]>;

  /**
   * Count likes for a post
   */
  countByPostId(postId: string): Promise<number>;

  /**
   * Count likes by a user
   */
  countByUserId(userId: string): Promise<number>;

  /**
   * Save like (create)
   */
  save(like: LikeEntity): Promise<void>;

  /**
   * Delete like by user and post
   */
  delete(userId: string, postId: string): Promise<void>;

  /**
   * Delete like by ID
   */
  deleteById(id: string): Promise<void>;
}

/**
 * Like Query Options
 */
export interface LikeQueryOptions {
  cursor?: string; // last ID for cursor pagination
  limit?: number;
}
