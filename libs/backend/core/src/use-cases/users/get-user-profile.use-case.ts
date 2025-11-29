/**
 * Get User Profile Use Case
 *
 * Retrieves a user's public profile with statistics.
 */

import type { IUserRepository } from '../../ports/repositories/user.repository.interface.js';
import type { IPostRepository } from '../../ports/repositories/post.repository.interface.js';
import type { IFollowRepository } from '../../ports/repositories/follow.repository.interface.js';
import { type Result, success, failure, ErrorCodes } from '../common/result.js';

export interface GetUserProfileInput {
  /** Username or ID to look up */
  usernameOrId: string;
  /** Current user ID (for checking if viewing own profile) */
  currentUserId?: string;
}

export interface UserProfileOutput {
  id: string;
  username: string;
  fullName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  socialLinks: Record<string, string>;
  emailVerified: boolean;
  createdAt: Date;
  stats: {
    postCount: number;
    followerCount: number;
    followingCount: number;
  };
  isOwnProfile: boolean;
}

export interface GetUserProfileOutput {
  user: UserProfileOutput;
}

export interface GetUserProfileDependencies {
  userRepository: IUserRepository;
  postRepository: IPostRepository;
  followRepository: IFollowRepository;
}

export class GetUserProfileUseCase {
  constructor(private readonly deps: GetUserProfileDependencies) {}

  async execute(
    input: GetUserProfileInput
  ): Promise<Result<GetUserProfileOutput>> {
    // 1. Find user by username or ID
    let user = await this.deps.userRepository.findByUsername(
      input.usernameOrId
    );
    if (!user) {
      user = await this.deps.userRepository.findById(input.usernameOrId);
    }

    if (!user) {
      return failure(ErrorCodes.USER_NOT_FOUND, 'User not found');
    }

    const userData = user.toJSON();

    // 2. Check if user is active (inactive users are hidden from public)
    if (!userData.isActive && input.currentUserId !== userData.id) {
      return failure(ErrorCodes.USER_NOT_FOUND, 'User not found');
    }

    // 3. Get post count
    const postCount = await this.deps.postRepository.countByAuthor(userData.id);

    // 4. Get follower/following counts
    const followerCount = await this.deps.followRepository.countFollowers(
      userData.id
    );
    const followingCount = await this.deps.followRepository.countFollowing(
      userData.id
    );

    // 5. Build response (public profile only)
    const isOwnProfile = input.currentUserId === userData.id;

    // Filter out undefined values from socialLinks
    const socialLinks: Record<string, string> = {};
    if (userData.socialLinks) {
      for (const [key, value] of Object.entries(userData.socialLinks)) {
        if (value !== undefined) {
          socialLinks[key] = value;
        }
      }
    }

    return success({
      user: {
        id: userData.id,
        username: userData.username,
        fullName: userData.fullName,
        bio: userData.bio,
        avatarUrl: userData.avatarUrl,
        socialLinks,
        emailVerified: userData.emailVerified,
        createdAt: userData.createdAt,
        stats: {
          postCount,
          followerCount,
          followingCount,
        },
        isOwnProfile,
      },
    });
  }
}
