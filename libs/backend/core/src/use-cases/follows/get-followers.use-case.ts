/**
 * Get Followers Use Case
 *
 * Retrieves paginated list of followers for a user.
 */

import type { FollowUserSummary } from '@blog/shared/domain';
import type { IFollowRepository } from '../../ports/repositories/follow.repository.interface.js';
import type { IUserRepository } from '../../ports/repositories/user.repository.interface.js';
import { type Result, success, failure, ErrorCodes } from '../common/result.js';

export interface GetFollowersInput {
  /** Username of the user to get followers for */
  username: string;
  /** Current user ID (for checking follow status) */
  currentUserId?: string;
  /** Pagination cursor */
  cursor?: string;
  /** Number of results per page */
  limit?: number;
}

export interface GetFollowersOutput {
  followers: FollowUserSummary[];
  nextCursor: string | null;
  hasMore: boolean;
  total: number;
}

export interface GetFollowersDependencies {
  followRepository: IFollowRepository;
  userRepository: IUserRepository;
}

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export class GetFollowersUseCase {
  constructor(private readonly deps: GetFollowersDependencies) {}

  async execute(input: GetFollowersInput): Promise<Result<GetFollowersOutput>> {
    // 1. Find target user
    const user = await this.deps.userRepository.findByUsername(input.username);
    if (!user) {
      return failure(ErrorCodes.USER_NOT_FOUND, 'User not found');
    }

    const userData = user.toJSON();
    if (!userData.isActive) {
      return failure(ErrorCodes.USER_NOT_FOUND, 'User not found');
    }

    const limit = Math.min(input.limit ?? DEFAULT_LIMIT, MAX_LIMIT);

    // 2. Get followers
    const followers = await this.deps.followRepository.findFollowers(
      userData.id,
      {
        cursor: input.cursor,
        limit: limit + 1, // Fetch one extra to check hasMore
        currentUserId: input.currentUserId,
      }
    );

    // 3. Check if there are more results
    const hasMore = followers.length > limit;
    const results = hasMore ? followers.slice(0, limit) : followers;

    // 4. Get total count
    const total = await this.deps.followRepository.countFollowers(userData.id);

    // 5. Calculate next cursor
    const nextCursor =
      hasMore && results.length > 0 ? results[results.length - 1].id : null;

    return success({
      followers: results,
      nextCursor,
      hasMore,
      total,
    });
  }
}
