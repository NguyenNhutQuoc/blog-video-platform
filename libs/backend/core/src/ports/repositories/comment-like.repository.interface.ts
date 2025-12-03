import type { CommentLikeEntity } from '@blog/shared/domain';

/**
 * Comment Like Repository Interface (Port)
 *
 * Defines the contract for comment like persistence operations.
 */
export interface ICommentLikeRepository {
  /**
   * Find like by user and comment
   */
  findByUserAndComment(
    userId: string,
    commentId: string
  ): Promise<CommentLikeEntity | null>;

  /**
   * Check if user has liked a comment
   */
  isCommentLikedByUser(userId: string, commentId: string): Promise<boolean>;

  /**
   * Bulk check if user has liked multiple comments
   */
  isCommentsLikedByUser(
    userId: string,
    commentIds: string[]
  ): Promise<Map<string, boolean>>;

  /**
   * Get all likes for a comment
   */
  findByCommentId(
    commentId: string,
    options?: CommentLikeQueryOptions
  ): Promise<CommentLikeEntity[]>;

  /**
   * Count likes for a comment
   */
  countByCommentId(commentId: string): Promise<number>;

  /**
   * Save like (create)
   */
  save(like: CommentLikeEntity): Promise<void>;

  /**
   * Delete like by user and comment
   */
  delete(userId: string, commentId: string): Promise<void>;
}

/**
 * Comment Like Query Options
 */
export interface CommentLikeQueryOptions {
  cursor?: string; // created_at cursor for pagination
  limit?: number;
}
