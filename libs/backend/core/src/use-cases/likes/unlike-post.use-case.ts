/**
 * Unlike Post Use Case
 *
 * Handles unliking a post.
 */

import type { ILikeRepository } from '../../ports/repositories/like.repository.interface.js';
import type { IPostRepository } from '../../ports/repositories/post.repository.interface.js';
import type { IUserRepository } from '../../ports/repositories/user.repository.interface.js';
import { type Result, success, failure, ErrorCodes } from '../common/result.js';

export interface UnlikePostInput {
  /** User who is unliking */
  userId: string;
  /** Post being unliked */
  postId: string;
}

export interface UnlikePostOutput {
  success: boolean;
  likeCount: number;
}

export interface UnlikePostDependencies {
  likeRepository: ILikeRepository;
  postRepository: IPostRepository;
  userRepository: IUserRepository;
}

export class UnlikePostUseCase {
  constructor(private readonly deps: UnlikePostDependencies) {}

  async execute(input: UnlikePostInput): Promise<Result<UnlikePostOutput>> {
    // Helper to check if string is valid UUID
    const isUUID = (str: string) =>
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        str
      );

    // 1. Validate user exists
    const user = await this.deps.userRepository.findById(input.userId);
    if (!user) {
      return failure(ErrorCodes.USER_NOT_FOUND, 'User not found');
    }

    // 2. Validate post exists (try by ID if UUID, otherwise by slug)
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

    // Use actual post ID for operations
    const postId = post.id;

    // 3. Check if like exists
    const existingLike = await this.deps.likeRepository.findByUserAndPost(
      input.userId,
      postId
    );
    if (!existingLike) {
      return failure(
        ErrorCodes.VALIDATION_ERROR,
        'You have not liked this post'
      );
    }

    // 4. Delete like
    await this.deps.likeRepository.delete(input.userId, postId);

    // 5. Get updated like count from database (trigger has updated post.like_count)
    const updatedPost = await this.deps.postRepository.findById(postId);
    const likeCount = updatedPost?.toJSON().likeCount ?? 0;

    // 6. Return result
    return success({
      success: true,
      likeCount,
    });
  }
}
