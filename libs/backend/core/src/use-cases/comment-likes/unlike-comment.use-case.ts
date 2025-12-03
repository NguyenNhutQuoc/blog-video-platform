/**
 * Unlike Comment Use Case
 *
 * Handles removing a like from a comment.
 */

import type { ICommentLikeRepository } from '../../ports/repositories/comment-like.repository.interface.js';
import type { ICommentRepository } from '../../ports/repositories/comment.repository.interface.js';
import type { IUserRepository } from '../../ports/repositories/user.repository.interface.js';
import { type Result, success, failure, ErrorCodes } from '../common/result.js';

export interface UnlikeCommentInput {
  userId: string;
  commentId: string;
}

export interface UnlikeCommentOutput {
  success: boolean;
  likeCount: number;
}

export interface UnlikeCommentDependencies {
  commentLikeRepository: ICommentLikeRepository;
  commentRepository: ICommentRepository;
  userRepository: IUserRepository;
}

export class UnlikeCommentUseCase {
  constructor(private readonly deps: UnlikeCommentDependencies) {}

  async execute(
    input: UnlikeCommentInput
  ): Promise<Result<UnlikeCommentOutput>> {
    // 1. Validate user exists
    const user = await this.deps.userRepository.findById(input.userId);
    if (!user) {
      return failure(ErrorCodes.USER_NOT_FOUND, 'User not found');
    }

    // 2. Validate comment exists
    const comment = await this.deps.commentRepository.findById(input.commentId);
    if (!comment) {
      return failure(ErrorCodes.COMMENT_NOT_FOUND, 'Comment not found');
    }

    // 3. Check if like exists
    const existingLike =
      await this.deps.commentLikeRepository.findByUserAndComment(
        input.userId,
        input.commentId
      );

    if (!existingLike) {
      return failure(
        ErrorCodes.VALIDATION_ERROR,
        'You have not liked this comment'
      );
    }

    // 4. Delete like
    await this.deps.commentLikeRepository.delete(input.userId, input.commentId);

    // 5. Get updated like count
    const likeCount = await this.deps.commentLikeRepository.countByCommentId(
      input.commentId
    );

    return success({
      success: true,
      likeCount,
    });
  }
}
