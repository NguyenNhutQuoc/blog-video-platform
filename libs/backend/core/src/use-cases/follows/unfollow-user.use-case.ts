/**
 * Unfollow User Use Case
 *
 * Handles unfollowing another user.
 */

import type { IFollowRepository } from '../../ports/repositories/follow.repository.interface.js';
import type { IUserRepository } from '../../ports/repositories/user.repository.interface.js';
import { type Result, success, failure, ErrorCodes } from '../common/result.js';

export interface UnfollowUserInput {
  /** User who is unfollowing */
  followerId: string;
  /** User being unfollowed (by username) */
  followingUsername: string;
}

export interface UnfollowUserOutput {
  success: boolean;
  unfollowed: {
    id: string;
    username: string;
  };
  followerCount: number;
}

export interface UnfollowUserDependencies {
  followRepository: IFollowRepository;
  userRepository: IUserRepository;
}

export class UnfollowUserUseCase {
  constructor(private readonly deps: UnfollowUserDependencies) {}

  async execute(input: UnfollowUserInput): Promise<Result<UnfollowUserOutput>> {
    // 1. Find follower
    const follower = await this.deps.userRepository.findById(input.followerId);
    if (!follower) {
      return failure(ErrorCodes.USER_NOT_FOUND, 'User not found');
    }

    const followerData = follower.toJSON();

    // 2. Find user to unfollow
    const following = await this.deps.userRepository.findByUsername(
      input.followingUsername
    );
    if (!following) {
      return failure(ErrorCodes.USER_NOT_FOUND, 'User not found');
    }

    const followingData = following.toJSON();

    // 3. Check if currently following
    const isFollowing = await this.deps.followRepository.isFollowing(
      followerData.id,
      followingData.id
    );
    if (!isFollowing) {
      return failure(
        ErrorCodes.VALIDATION_ERROR,
        'You are not following this user'
      );
    }

    // 4. Delete follow relationship
    await this.deps.followRepository.delete(followerData.id, followingData.id);

    // 5. Get updated follower count
    const followerCount = await this.deps.followRepository.countFollowers(
      followingData.id
    );

    // 6. Return result
    return success({
      success: true,
      unfollowed: {
        id: followingData.id,
        username: followingData.username,
      },
      followerCount,
    });
  }
}
