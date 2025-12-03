/**
 * Get Post Comments Use Case
 *
 * Retrieves comments for a post with cursor-based pagination.
 * Supports fetching root comments or replies to a specific comment.
 */

import type { ICommentRepository } from '../../ports/repositories/comment.repository.interface.js';
import type { ICommentLikeRepository } from '../../ports/repositories/comment-like.repository.interface.js';
import type { IPostRepository } from '../../ports/repositories/post.repository.interface.js';
import type { IUserRepository } from '../../ports/repositories/user.repository.interface.js';
import { type Result, success, failure, ErrorCodes } from '../common/result.js';

export interface GetPostCommentsInput {
  /** Post ID to get comments for */
  postId: string;
  /** Parent comment ID - null for root comments, set for replies */
  parentId?: string | null;
  /** Pagination cursor (last comment ID) */
  cursor?: string;
  /** Number of comments to fetch (default 20, max 50) */
  limit?: number;
  /** Sort order */
  orderBy?: 'createdAt' | 'likeCount';
  orderDir?: 'asc' | 'desc';
  /** Current user ID (for isLiked check) */
  userId?: string;
}

export interface CommentWithAuthor {
  id: string;
  postId: string;
  userId: string;
  parentId: string | null;
  content: string;
  status: string;
  likeCount: number;
  replyCount: number;
  isLiked: boolean;
  createdAt: Date;
  updatedAt: Date;
  author: {
    id: string;
    username: string;
    fullName: string | null;
    avatarUrl: string | null;
  };
}

export interface GetPostCommentsOutput {
  data: CommentWithAuthor[];
  nextCursor: string | null;
  hasMore: boolean;
  total: number;
}

export interface GetPostCommentsDependencies {
  commentRepository: ICommentRepository;
  commentLikeRepository?: ICommentLikeRepository;
  postRepository: IPostRepository;
  userRepository: IUserRepository;
}

export class GetPostCommentsUseCase {
  constructor(private readonly deps: GetPostCommentsDependencies) {}

  async execute(
    input: GetPostCommentsInput
  ): Promise<Result<GetPostCommentsOutput>> {
    // 1. Validate limit
    const limit = Math.min(Math.max(input.limit ?? 20, 1), 50);

    // Helper to check if string is valid UUID
    const isUUID = (str: string) =>
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        str
      );

    // 2. Validate post exists (try by ID if UUID, otherwise by slug)
    let post = null;
    if (isUUID(input.postId)) {
      post = await this.deps.postRepository.findById(input.postId);
    }
    if (!post) {
      // Try finding by slug
      post = await this.deps.postRepository.findBySlug(input.postId);
    }
    if (!post) {
      return failure(ErrorCodes.POST_NOT_FOUND, 'Post not found');
    }

    if (post.isDeleted()) {
      return failure(ErrorCodes.POST_NOT_FOUND, 'Post not found');
    }

    // Use the actual post ID for queries
    const postId = post.id;

    // 3. If fetching replies, validate parent comment exists
    if (input.parentId) {
      const parentComment = await this.deps.commentRepository.findById(
        input.parentId
      );
      if (!parentComment) {
        return failure(
          ErrorCodes.COMMENT_NOT_FOUND,
          'Parent comment not found'
        );
      }
    }

    // 4. Determine if fetching root comments or replies
    const isRootComments = !input.parentId;

    // 5. Fetch comments with pagination
    let comments;
    if (isRootComments) {
      comments = await this.deps.commentRepository.findRootsByPostId(postId, {
        status: 'approved',
        includeDeleted: false,
        limit: limit + 1, // Fetch one extra to check hasMore
        orderBy: input.orderBy ?? 'createdAt',
        orderDir: input.orderDir ?? 'desc',
      });
    } else {
      comments = await this.deps.commentRepository.findReplies(input.parentId!);
    }

    // 6. Handle cursor-based pagination
    if (input.cursor) {
      const cursorIndex = comments.findIndex((c) => c.id === input.cursor);
      if (cursorIndex !== -1) {
        comments = comments.slice(cursorIndex + 1);
      }
    }

    // 7. Check if there are more results
    const hasMore = comments.length > limit;
    if (hasMore) {
      comments = comments.slice(0, limit);
    }

    // 8. Get author info for each comment
    const authorIds = [...new Set(comments.map((c) => c.userId))];
    const authors = await Promise.all(
      authorIds.map((id) => this.deps.userRepository.findById(id))
    );
    const authorMap = new Map(
      authors
        .filter((a): a is NonNullable<typeof a> => a !== null)
        .map((a) => {
          const data = a.toJSON();
          return [data.id, data];
        })
    );

    // 8.5 Get isLiked status for all comments if user is authenticated
    const commentIds = comments.map((c) => c.id);
    let likedCommentIds: Set<string> = new Set();
    if (input.userId && this.deps.commentLikeRepository) {
      const likedMap =
        await this.deps.commentLikeRepository.isCommentsLikedByUser(
          input.userId,
          commentIds
        );
      likedCommentIds = new Set(
        Array.from(likedMap.entries())
          .filter(([, isLiked]) => isLiked)
          .map(([id]) => id)
      );
    }

    // 9. Get reply count for root comments
    const commentsWithMetadata = await Promise.all(
      comments.map(async (comment) => {
        const commentData = comment.toJSON();
        const author = authorMap.get(commentData.userId);

        // Count replies for root comments
        let replyCount = 0;
        if (isRootComments) {
          const replies = await this.deps.commentRepository.findReplies(
            commentData.id
          );
          replyCount = replies.filter((r) => !r.isDeleted()).length;
        }

        return {
          id: commentData.id,
          postId: commentData.postId,
          userId: commentData.userId,
          parentId: commentData.parentId,
          content: commentData.content,
          status: commentData.status,
          likeCount: commentData.likeCount ?? 0,
          replyCount,
          isLiked: likedCommentIds.has(commentData.id),
          createdAt: commentData.createdAt,
          updatedAt: commentData.updatedAt,
          author: author
            ? {
                id: author.id,
                username: author.username,
                fullName: author.fullName,
                avatarUrl: author.avatarUrl,
              }
            : {
                id: commentData.userId,
                username: '[deleted]',
                fullName: null,
                avatarUrl: null,
              },
        };
      })
    );

    // 10. Calculate next cursor
    const nextCursor =
      hasMore && commentsWithMetadata.length > 0
        ? commentsWithMetadata[commentsWithMetadata.length - 1].id
        : null;

    // 11. Get total count
    const total = await this.deps.commentRepository.countByPost(postId);

    // 12. Return result
    return success({
      data: commentsWithMetadata,
      nextCursor,
      hasMore,
      total,
    });
  }
}
