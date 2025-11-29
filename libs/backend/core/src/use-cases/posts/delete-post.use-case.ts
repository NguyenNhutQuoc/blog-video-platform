/**
 * Delete Post Use Case
 *
 * Handles post deletion (soft delete) with ownership verification.
 */

import type { IPostRepository } from '../../ports/repositories/post.repository.interface.js';
import type { IUserRepository } from '../../ports/repositories/user.repository.interface.js';
import { type Result, success, failure, ErrorCodes } from '../common/result.js';

export interface DeletePostInput {
  postId: string;
  userId: string;
}

export interface DeletePostOutput {
  success: boolean;
  deletedAt: Date;
}

export interface DeletePostDependencies {
  postRepository: IPostRepository;
  userRepository: IUserRepository;
}

export class DeletePostUseCase {
  constructor(private readonly deps: DeletePostDependencies) {}

  async execute(input: DeletePostInput): Promise<Result<DeletePostOutput>> {
    // 1. Find post
    const post = await this.deps.postRepository.findById(input.postId);
    if (!post) {
      return failure(ErrorCodes.POST_NOT_FOUND, 'Post not found');
    }

    // 2. Check if already deleted
    if (post.isDeleted()) {
      return failure(ErrorCodes.POST_NOT_FOUND, 'Post not found');
    }

    const postData = post.toJSON();

    // 3. Verify ownership or admin (BR-01)
    const user = await this.deps.userRepository.findById(input.userId);
    if (!user) {
      return failure(ErrorCodes.USER_NOT_FOUND, 'User not found');
    }

    const userData = user.toJSON();
    const isOwner = postData.authorId === input.userId;
    const isAdmin = userData.isAdmin;

    if (!isOwner && !isAdmin) {
      return failure(
        ErrorCodes.UNAUTHORIZED_TO_EDIT,
        'You do not have permission to delete this post'
      );
    }

    // 4. Soft delete post
    post.softDelete();
    await this.deps.postRepository.save(post);

    // 5. Return result
    return success({
      success: true,
      deletedAt: post.toJSON().deletedAt!,
    });
  }
}
