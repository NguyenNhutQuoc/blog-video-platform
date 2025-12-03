/**
 * Delete Comment Use Case
 *
 * Handles soft-deleting a comment (owner or admin only).
 */

import type { ICommentRepository } from '../../ports/repositories/comment.repository.interface.js';
import type { IUserRepository } from '../../ports/repositories/user.repository.interface.js';
import { type Result, success, failure, ErrorCodes } from '../common/result.js';

export interface DeleteCommentInput {
  /** Comment to delete */
  commentId: string;
  /** User requesting deletion */
  userId: string;
}

export interface DeleteCommentOutput {
  success: boolean;
  deletedCommentId: string;
}

export interface DeleteCommentDependencies {
  commentRepository: ICommentRepository;
  userRepository: IUserRepository;
}

export class DeleteCommentUseCase {
  constructor(private readonly deps: DeleteCommentDependencies) {}

  async execute(
    input: DeleteCommentInput
  ): Promise<Result<DeleteCommentOutput>> {
    // 1. Validate user exists
    const user = await this.deps.userRepository.findById(input.userId);
    if (!user) {
      return failure(ErrorCodes.USER_NOT_FOUND, 'User not found');
    }

    const userData = user.toJSON();

    // 2. Find comment
    const comment = await this.deps.commentRepository.findById(input.commentId);
    if (!comment) {
      return failure(ErrorCodes.COMMENT_NOT_FOUND, 'Comment not found');
    }

    const commentData = comment.toJSON();

    // 3. Check if already deleted
    if (commentData.deletedAt !== null) {
      return failure(ErrorCodes.COMMENT_NOT_FOUND, 'Comment not found');
    }

    // 4. Authorization: only owner or admin can delete
    const isOwner = commentData.userId === input.userId;
    const isAdmin = userData.isAdmin === true;

    if (!isOwner && !isAdmin) {
      return failure(
        ErrorCodes.UNAUTHORIZED,
        'You are not authorized to delete this comment'
      );
    }

    // 5. Soft delete the comment
    comment.softDelete(input.userId);
    await this.deps.commentRepository.save(comment);

    // 6. Return result
    return success({
      success: true,
      deletedCommentId: input.commentId,
    });
  }
}
