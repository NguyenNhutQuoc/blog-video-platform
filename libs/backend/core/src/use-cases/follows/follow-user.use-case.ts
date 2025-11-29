/**
 * Follow User Use Case
 *
 * Handles following another user with business rules validation.
 */

import { FollowEntity } from '@blog/shared/domain';
import type { IFollowRepository } from '../../ports/repositories/follow.repository.interface.js';
import type { IUserRepository } from '../../ports/repositories/user.repository.interface.js';
import { type Result, success, failure, ErrorCodes } from '../common/result.js';

export interface FollowUserInput {
  /** User who is following */
  followerId: string;
  /** User being followed (by username) */
  followingUsername: string;
}

export interface FollowUserOutput {
  success: boolean;
  following: {
    id: string;
    username: string;
    fullName: string | null;
    avatarUrl: string | null;
  };
  followerCount: number;
}

export interface FollowUserDependencies {
  followRepository: IFollowRepository;
  userRepository: IUserRepository;
}

export class FollowUserUseCase {
  constructor(private readonly deps: FollowUserDependencies) {}

  async execute(input: FollowUserInput): Promise<Result<FollowUserOutput>> {
    // 1. Find follower
    const follower = await this.deps.userRepository.findById(input.followerId);
    if (!follower) {
      return failure(ErrorCodes.USER_NOT_FOUND, 'User not found');
    }

    const followerData = follower.toJSON();
    if (!followerData.isActive) {
      return failure(ErrorCodes.USER_INACTIVE, 'Your account is inactive');
    }

    // 2. Find user to follow
    const following = await this.deps.userRepository.findByUsername(
      input.followingUsername
    );
    if (!following) {
      return failure(ErrorCodes.USER_NOT_FOUND, 'User to follow not found');
    }

    const followingData = following.toJSON();
    if (!followingData.isActive) {
      return failure(ErrorCodes.USER_NOT_FOUND, 'User not found');
    }

    // 3. Business rule: Cannot follow yourself
    if (followerData.id === followingData.id) {
      return failure(ErrorCodes.VALIDATION_ERROR, 'Cannot follow yourself');
    }

    // 4. Check if already following
    const existingFollow = await this.deps.followRepository.isFollowing(
      followerData.id,
      followingData.id
    );
    if (existingFollow) {
      return failure(
        ErrorCodes.VALIDATION_ERROR,
        'You are already following this user'
      );
    }

    // 5. Create follow relationship
    const follow = FollowEntity.create({
      followerId: followerData.id,
      followingId: followingData.id,
    });

    await this.deps.followRepository.save(follow);

    // 6. Get updated follower count
    const followerCount = await this.deps.followRepository.countFollowers(
      followingData.id
    );

    // 7. Return result
    return success({
      success: true,
      following: {
        id: followingData.id,
        username: followingData.username,
        fullName: followingData.fullName,
        avatarUrl: followingData.avatarUrl,
      },
      followerCount,
    });
  }
}
