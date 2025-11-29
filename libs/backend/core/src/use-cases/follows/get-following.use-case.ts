/**
 * Get Following Use Case
 *
 * Retrieves paginated list of users that a user follows.
 */

import type { FollowUserSummary } from '@blog/shared/domain';
import type { IFollowRepository } from '../../ports/repositories/follow.repository.interface.js';
import type { IUserRepository } from '../../ports/repositories/user.repository.interface.js';
import { type Result, success, failure, ErrorCodes } from '../common/result.js';

export interface GetFollowingInput {
  /** Username of the user to get following list for */
  username: string;
  /** Current user ID (for checking follow status) */
  currentUserId?: string;
  /** Pagination cursor */
  cursor?: string;
  /** Number of results per page */
  limit?: number;
}

export interface GetFollowingOutput {
  following: FollowUserSummary[];
  nextCursor: string | null;
  hasMore: boolean;
  total: number;
}

export interface GetFollowingDependencies {
  followRepository: IFollowRepository;
  userRepository: IUserRepository;
}

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export class GetFollowingUseCase {
  constructor(private readonly deps: GetFollowingDependencies) {}

  async execute(input: GetFollowingInput): Promise<Result<GetFollowingOutput>> {
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

    // 2. Get following
    const following = await this.deps.followRepository.findFollowing(
      userData.id,
      {
        cursor: input.cursor,
        limit: limit + 1, // Fetch one extra to check hasMore
        currentUserId: input.currentUserId,
      }
    );

    // 3. Check if there are more results
    const hasMore = following.length > limit;
    const results = hasMore ? following.slice(0, limit) : following;

    // 4. Get total count
    const total = await this.deps.followRepository.countFollowing(userData.id);

    // 5. Calculate next cursor
    const nextCursor =
      hasMore && results.length > 0 ? results[results.length - 1].id : null;

    return success({
      following: results,
      nextCursor,
      hasMore,
      total,
    });
  }
}
