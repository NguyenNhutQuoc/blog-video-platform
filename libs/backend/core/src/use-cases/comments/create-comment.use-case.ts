/**
 * Create Comment Use Case
 *
 * Handles creating a new comment or reply with business rules validation.
 */

import { CommentEntity, CommentStatus } from '@blog/shared/domain';
import type { ICommentRepository } from '../../ports/repositories/comment.repository.interface.js';
import type { IPostRepository } from '../../ports/repositories/post.repository.interface.js';
import type { IUserRepository } from '../../ports/repositories/user.repository.interface.js';
import { type Result, success, failure, ErrorCodes } from '../common/result.js';

export interface CreateCommentInput {
  /** User creating the comment */
  userId: string;
  /** Post being commented on */
  postId: string;
  /** Comment content (1-500 chars) */
  content: string;
  /** Parent comment ID for replies (optional) */
  parentId?: string;
}

export interface CreateCommentOutput {
  comment: {
    id: string;
    postId: string;
    userId: string;
    parentId: string | null;
    content: string;
    status: string;
    createdAt: Date;
  };
  author: {
    id: string;
    username: string;
    fullName: string | null;
    avatarUrl: string | null;
  };
}

export interface CreateCommentDependencies {
  commentRepository: ICommentRepository;
  postRepository: IPostRepository;
  userRepository: IUserRepository;
}

export class CreateCommentUseCase {
  constructor(private readonly deps: CreateCommentDependencies) {}

  async execute(
    input: CreateCommentInput
  ): Promise<Result<CreateCommentOutput>> {
    // 1. Validate content length
    const content = input.content.trim();
    if (content.length < 1) {
      return failure(ErrorCodes.VALIDATION_ERROR, 'Comment cannot be empty', {
        field: 'content',
      });
    }
    if (content.length > 500) {
      return failure(
        ErrorCodes.VALIDATION_ERROR,
        'Comment must be at most 500 characters',
        { field: 'content' }
      );
    }

    // 2. Validate user exists and is active
    const user = await this.deps.userRepository.findById(input.userId);
    if (!user) {
      return failure(ErrorCodes.USER_NOT_FOUND, 'User not found');
    }

    const userData = user.toJSON();
    if (!userData.isActive) {
      return failure(ErrorCodes.USER_INACTIVE, 'Your account is inactive');
    }

    // 3. Validate post exists and is published
    // Check if input is UUID or slug
    const isUUID = (str: string) =>
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        str
      );

    let post = null;
    if (isUUID(input.postId)) {
      post = await this.deps.postRepository.findById(input.postId);
    }
    if (!post) {
      post = await this.deps.postRepository.findBySlug(input.postId);
    }
    if (!post) {
      return failure(ErrorCodes.POST_NOT_FOUND, 'Post not found');
    }

    // Use resolved post ID for all subsequent operations
    const resolvedPostId = post.toJSON().id;

    if (post.isDeleted()) {
      return failure(ErrorCodes.POST_NOT_FOUND, 'Post not found');
    }

    const postData = post.toJSON();
    if (postData.status !== 'published') {
      return failure(
        ErrorCodes.VALIDATION_ERROR,
        'Cannot comment on unpublished posts'
      );
    }

    // 4. If replying, validate parent comment exists and is not a reply itself
    let parentId: string | null = null;
    if (input.parentId) {
      const parentComment = await this.deps.commentRepository.findById(
        input.parentId
      );
      if (!parentComment) {
        return failure(
          ErrorCodes.VALIDATION_ERROR,
          'Parent comment not found',
          { field: 'parentId' }
        );
      }

      // Check that parent is a root comment (not a reply to reply)
      const parentData = parentComment.toJSON();
      if (parentData.parentId !== null) {
        return failure(
          ErrorCodes.VALIDATION_ERROR,
          'Cannot reply to a reply. Only 1-level comments allowed.',
          { field: 'parentId' }
        );
      }

      // Check parent belongs to same post
      if (parentData.postId !== resolvedPostId) {
        return failure(
          ErrorCodes.VALIDATION_ERROR,
          'Parent comment does not belong to this post',
          { field: 'parentId' }
        );
      }

      parentId = input.parentId;
    }

    // 5. Check for sensitive words and determine initial status
    const hasSensitiveContent = CommentEntity.hasSensitiveWords(content);
    const initialStatus = hasSensitiveContent
      ? CommentStatus.PENDING_REVIEW
      : CommentStatus.APPROVED;

    // 6. Create comment entity
    const now = new Date();
    const commentData = {
      id: crypto.randomUUID(),
      postId: resolvedPostId,
      userId: input.userId,
      parentId,
      content,
      isFlagged: hasSensitiveContent,
      likeCount: 0,
      status: initialStatus,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      deletedBy: null,
    };

    const comment = CommentEntity.fromPersistence(commentData);

    // 7. Save comment
    await this.deps.commentRepository.save(comment);

    // 8. Return result
    return success({
      comment: {
        id: commentData.id,
        postId: commentData.postId,
        userId: commentData.userId,
        parentId: commentData.parentId,
        content: commentData.content,
        status: commentData.status,
        createdAt: commentData.createdAt,
      },
      author: {
        id: userData.id,
        username: userData.username,
        fullName: userData.fullName,
        avatarUrl: userData.avatarUrl,
      },
    });
  }
}
