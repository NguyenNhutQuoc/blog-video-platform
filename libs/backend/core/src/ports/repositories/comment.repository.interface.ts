import type { CommentEntity } from '@blog/shared/domain';

/**
 * Comment Repository Interface (Port)
 *
 * Defines the contract for comment persistence operations.
 */
export interface ICommentRepository {
  /**
   * Find comment by ID
   */
  findById(id: string): Promise<CommentEntity | null>;

  /**
   * Find comments by post ID
   */
  findByPostId(
    postId: string,
    options?: CommentQueryOptions
  ): Promise<CommentEntity[]>;

  /**
   * Find replies to a comment
   */
  findReplies(commentId: string): Promise<CommentEntity[]>;

  /**
   * Find comments by user ID
   */
  findByUserId(
    userId: string,
    options?: CommentQueryOptions
  ): Promise<CommentEntity[]>;

  /**
   * Find comments pending moderation
   */
  findPendingModeration(
    options?: CommentModerationOptions
  ): Promise<CommentEntity[]>;

  /**
   * Save comment (create or update)
   */
  save(comment: CommentEntity): Promise<void>;

  /**
   * Delete comment (soft delete)
   */
  softDelete(id: string): Promise<void>;

  /**
   * Hard delete comment and all replies
   */
  hardDelete(id: string): Promise<void>;

  /**
   * Count comments by post
   */
  countByPost(postId: string): Promise<number>;

  /**
   * Count comments by user
   */
  countByUser(userId: string): Promise<number>;

  /**
   * Count pending moderation comments
   */
  countPendingModeration(): Promise<number>;

  /**
   * Find root comments (not replies) by post
   */
  findRootsByPostId(
    postId: string,
    options?: CommentQueryOptions
  ): Promise<CommentEntity[]>;

  /**
   * Batch update comment status
   */
  batchUpdateStatus(ids: string[], status: string): Promise<void>;
}

/**
 * Comment Query Options
 */
export interface CommentQueryOptions {
  status?: string | string[];
  includeDeleted?: boolean;
  includeReplies?: boolean;
  limit?: number;
  offset?: number;
  orderBy?: 'createdAt' | 'likeCount';
  orderDir?: 'asc' | 'desc';
}

/**
 * Comment Moderation Options
 */
export interface CommentModerationOptions {
  limit?: number;
  offset?: number;
  orderBy?: 'createdAt' | 'postId';
  orderDir?: 'asc' | 'desc';
}
