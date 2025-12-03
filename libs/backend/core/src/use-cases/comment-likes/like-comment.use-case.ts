/**
 * Like Comment Use Case
 *
 * Handles liking a comment.
 */

import { CommentLikeEntity } from '@blog/shared/domain';
import type { ICommentLikeRepository } from '../../ports/repositories/comment-like.repository.interface.js';
import type { ICommentRepository } from '../../ports/repositories/comment.repository.interface.js';
import type { IUserRepository } from '../../ports/repositories/user.repository.interface.js';
import { type Result, success, failure, ErrorCodes } from '../common/result.js';

export interface LikeCommentInput {
  userId: string;
  commentId: string;
}

export interface LikeCommentOutput {
  success: boolean;
  likeCount: number;
}

export interface LikeCommentDependencies {
  commentLikeRepository: ICommentLikeRepository;
  commentRepository: ICommentRepository;
  userRepository: IUserRepository;
}

export class LikeCommentUseCase {
  constructor(private readonly deps: LikeCommentDependencies) {}

  async execute(input: LikeCommentInput): Promise<Result<LikeCommentOutput>> {
    // 1. Validate user exists and is active
    const user = await this.deps.userRepository.findById(input.userId);
    if (!user) {
      return failure(ErrorCodes.USER_NOT_FOUND, 'User not found');
    }

    const userData = user.toJSON();
    if (!userData.isActive) {
      return failure(ErrorCodes.USER_INACTIVE, 'Your account is inactive');
    }

    // 2. Validate comment exists
    const comment = await this.deps.commentRepository.findById(input.commentId);
    if (!comment) {
      return failure(ErrorCodes.COMMENT_NOT_FOUND, 'Comment not found');
    }

    if (comment.isDeleted()) {
      return failure(ErrorCodes.COMMENT_NOT_FOUND, 'Comment not found');
    }

    // 3. Check if already liked
    const existingLike =
      await this.deps.commentLikeRepository.findByUserAndComment(
        input.userId,
        input.commentId
      );

    if (existingLike) {
      return failure(
        ErrorCodes.VALIDATION_ERROR,
        'You have already liked this comment'
      );
    }

    // 4. Create like entity
    const like = CommentLikeEntity.create({
      userId: input.userId,
      commentId: input.commentId,
    });

    // 5. Save like
    await this.deps.commentLikeRepository.save(like);

    // 6. Get updated like count
    const likeCount = await this.deps.commentLikeRepository.countByCommentId(
      input.commentId
    );

    return success({
      success: true,
      likeCount,
    });
  }
}
