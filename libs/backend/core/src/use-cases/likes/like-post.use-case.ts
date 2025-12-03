/**
 * Like Post Use Case
 *
 * Handles liking a post with business rules validation.
 */

import { LikeEntity } from '@blog/shared/domain';
import type { ILikeRepository } from '../../ports/repositories/like.repository.interface.js';
import type { IPostRepository } from '../../ports/repositories/post.repository.interface.js';
import type { IUserRepository } from '../../ports/repositories/user.repository.interface.js';
import { type Result, success, failure, ErrorCodes } from '../common/result.js';

export interface LikePostInput {
  /** User who is liking */
  userId: string;
  /** Post being liked */
  postId: string;
}

export interface LikePostOutput {
  success: boolean;
  likeCount: number;
}

export interface LikePostDependencies {
  likeRepository: ILikeRepository;
  postRepository: IPostRepository;
  userRepository: IUserRepository;
}

export class LikePostUseCase {
  constructor(private readonly deps: LikePostDependencies) {}

  async execute(input: LikePostInput): Promise<Result<LikePostOutput>> {
    // Helper to check if string is valid UUID
    const isUUID = (str: string) =>
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        str
      );

    // 1. Validate user exists and is active
    const user = await this.deps.userRepository.findById(input.userId);
    if (!user) {
      return failure(ErrorCodes.USER_NOT_FOUND, 'User not found');
    }

    const userData = user.toJSON();
    if (!userData.isActive) {
      return failure(ErrorCodes.USER_INACTIVE, 'Your account is inactive');
    }

    // 2. Validate post exists and is not deleted (try by ID if UUID, otherwise by slug)
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

    if (post.isDeleted()) {
      return failure(ErrorCodes.POST_NOT_FOUND, 'Post not found');
    }

    // Use actual post ID for operations
    const postId = post.id;

    // 3. Check if already liked
    const existingLike = await this.deps.likeRepository.findByUserAndPost(
      input.userId,
      postId
    );
    if (existingLike) {
      return failure(
        ErrorCodes.VALIDATION_ERROR,
        'You have already liked this post'
      );
    }

    // 4. Create like
    const like = LikeEntity.create({
      userId: input.userId,
      postId,
    });

    await this.deps.likeRepository.save(like);

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
