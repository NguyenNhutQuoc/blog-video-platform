/**
 * Follow Test Fixtures
 *
 * Factory functions for creating test follow entities.
 */

import { FollowEntity } from '@blog/shared/domain';

let followCounter = 0;

/**
 * Options for creating a test follow
 */
export interface CreateTestFollowOptions {
  followerId: string;
  followingId: string;
}

/**
 * Create a test follow entity
 */
export function createTestFollow(
  options: CreateTestFollowOptions
): FollowEntity {
  followCounter++;

  return FollowEntity.create({
    followerId: options.followerId,
    followingId: options.followingId,
  });
}

/**
 * Create multiple follow relationships from one user to many
 */
export function createTestFollowsFromUser(
  followerId: string,
  followingIds: string[]
): FollowEntity[] {
  return followingIds.map((followingId) =>
    createTestFollow({ followerId, followingId })
  );
}

/**
 * Create multiple follow relationships from many users to one
 */
export function createTestFollowersForUser(
  followingId: string,
  followerIds: string[]
): FollowEntity[] {
  return followerIds.map((followerId) =>
    createTestFollow({ followerId, followingId })
  );
}

/**
 * Reset follow counter (call in beforeEach for predictable data)
 */
export function resetFollowCounter(): void {
  followCounter = 0;
}
