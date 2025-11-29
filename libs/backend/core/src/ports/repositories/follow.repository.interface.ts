import type { FollowEntity, FollowUserSummary } from '@blog/shared/domain';

/**
 * Follow Repository Interface (Port)
 *
 * Defines the contract for follow relationship persistence operations.
 */
export interface IFollowRepository {
  /**
   * Find follow relationship by ID
   */
  findById(id: string): Promise<FollowEntity | null>;

  /**
   * Find follow relationship between two users
   */
  findByUsers(
    followerId: string,
    followingId: string
  ): Promise<FollowEntity | null>;

  /**
   * Check if user A follows user B
   */
  isFollowing(followerId: string, followingId: string): Promise<boolean>;

  /**
   * Get all users that a user follows
   */
  findFollowing(
    userId: string,
    options?: FollowQueryOptions
  ): Promise<FollowUserSummary[]>;

  /**
   * Get all followers of a user
   */
  findFollowers(
    userId: string,
    options?: FollowQueryOptions
  ): Promise<FollowUserSummary[]>;

  /**
   * Count followers of a user
   */
  countFollowers(userId: string): Promise<number>;

  /**
   * Count users that a user follows
   */
  countFollowing(userId: string): Promise<number>;

  /**
   * Save follow relationship (create)
   */
  save(follow: FollowEntity): Promise<void>;

  /**
   * Delete follow relationship (unfollow)
   */
  delete(followerId: string, followingId: string): Promise<void>;

  /**
   * Delete by ID
   */
  deleteById(id: string): Promise<void>;

  /**
   * Get mutual followers (users that follow each other)
   */
  findMutualFollowers(
    userId: string,
    otherUserId: string,
    options?: FollowQueryOptions
  ): Promise<FollowUserSummary[]>;

  /**
   * Get follow suggestions (users that user's followings follow)
   */
  findSuggestions(userId: string, limit?: number): Promise<FollowUserSummary[]>;

  /**
   * Bulk check if user follows multiple users
   */
  isFollowingMany(
    followerId: string,
    followingIds: string[]
  ): Promise<Map<string, boolean>>;
}

/**
 * Follow Query Options
 */
export interface FollowQueryOptions {
  cursor?: string; // last ID for cursor pagination
  limit?: number;
  /** Include whether current user follows each returned user */
  currentUserId?: string;
}
