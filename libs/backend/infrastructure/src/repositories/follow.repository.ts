/**
 * PostgreSQL Follow Repository
 *
 * Implementation of IFollowRepository using Kysely.
 */

import type { Kysely } from 'kysely';
import type { Database } from '../database/types.js';
import type { IFollowRepository, FollowQueryOptions } from '@blog/backend/core';
import { FollowEntity, type FollowUserSummary } from '@blog/shared/domain';
import { toDomainFollow, toNewFollowRow } from '../mappers/follow.mapper.js';

export class PostgresFollowRepository implements IFollowRepository {
  constructor(private readonly db: Kysely<Database>) {}

  async findById(id: string): Promise<FollowEntity | null> {
    const row = await this.db
      .selectFrom('follows')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();

    return row ? toDomainFollow(row) : null;
  }

  async findByUsers(
    followerId: string,
    followingId: string
  ): Promise<FollowEntity | null> {
    const row = await this.db
      .selectFrom('follows')
      .selectAll()
      .where('follower_id', '=', followerId)
      .where('following_id', '=', followingId)
      .executeTakeFirst();

    return row ? toDomainFollow(row) : null;
  }

  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    const result = await this.db
      .selectFrom('follows')
      .select(this.db.fn.count<number>('id').as('count'))
      .where('follower_id', '=', followerId)
      .where('following_id', '=', followingId)
      .executeTakeFirst();

    return (result?.count ?? 0) > 0;
  }

  async findFollowing(
    userId: string,
    options?: FollowQueryOptions
  ): Promise<FollowUserSummary[]> {
    const limit = options?.limit ?? 20;

    let query = this.db
      .selectFrom('follows')
      .innerJoin('users', 'users.id', 'follows.following_id')
      .select([
        'users.id',
        'users.username',
        'users.full_name as fullName',
        'users.avatar_url as avatarUrl',
        'users.bio',
        'follows.created_at as followedAt',
      ])
      .where('follows.follower_id', '=', userId)
      .where('users.deleted_at', 'is', null)
      .where('users.is_active', '=', true)
      .orderBy('follows.created_at', 'desc')
      .limit(limit);

    if (options?.cursor) {
      query = query.where('follows.id', '<', options.cursor);
    }

    const rows = await query.execute();

    // Get follow status for current user if provided
    let followStatusMap = new Map<string, boolean>();
    if (options?.currentUserId) {
      followStatusMap = await this.isFollowingMany(
        options.currentUserId,
        rows.map((r) => r.id)
      );
    }

    return rows.map((row) => ({
      id: row.id,
      username: row.username,
      fullName: row.fullName,
      avatarUrl: row.avatarUrl,
      bio: row.bio,
      isFollowing: followStatusMap.get(row.id) ?? false,
    }));
  }

  async findFollowers(
    userId: string,
    options?: FollowQueryOptions
  ): Promise<FollowUserSummary[]> {
    const limit = options?.limit ?? 20;

    let query = this.db
      .selectFrom('follows')
      .innerJoin('users', 'users.id', 'follows.follower_id')
      .select([
        'users.id',
        'users.username',
        'users.full_name as fullName',
        'users.avatar_url as avatarUrl',
        'users.bio',
        'follows.created_at as followedAt',
      ])
      .where('follows.following_id', '=', userId)
      .where('users.deleted_at', 'is', null)
      .where('users.is_active', '=', true)
      .orderBy('follows.created_at', 'desc')
      .limit(limit);

    if (options?.cursor) {
      query = query.where('follows.id', '<', options.cursor);
    }

    const rows = await query.execute();

    // Get follow status for current user if provided
    let followStatusMap = new Map<string, boolean>();
    if (options?.currentUserId) {
      followStatusMap = await this.isFollowingMany(
        options.currentUserId,
        rows.map((r) => r.id)
      );
    }

    return rows.map((row) => ({
      id: row.id,
      username: row.username,
      fullName: row.fullName,
      avatarUrl: row.avatarUrl,
      bio: row.bio,
      isFollowing: followStatusMap.get(row.id) ?? false,
    }));
  }

  async countFollowers(userId: string): Promise<number> {
    const result = await this.db
      .selectFrom('follows')
      .select(this.db.fn.count<number>('id').as('count'))
      .where('following_id', '=', userId)
      .executeTakeFirst();

    return result?.count ?? 0;
  }

  async countFollowing(userId: string): Promise<number> {
    const result = await this.db
      .selectFrom('follows')
      .select(this.db.fn.count<number>('id').as('count'))
      .where('follower_id', '=', userId)
      .executeTakeFirst();

    return result?.count ?? 0;
  }

  async save(follow: FollowEntity): Promise<void> {
    await this.db
      .insertInto('follows')
      .values(toNewFollowRow(follow))
      .execute();
  }

  async delete(followerId: string, followingId: string): Promise<void> {
    await this.db
      .deleteFrom('follows')
      .where('follower_id', '=', followerId)
      .where('following_id', '=', followingId)
      .execute();
  }

  async deleteById(id: string): Promise<void> {
    await this.db.deleteFrom('follows').where('id', '=', id).execute();
  }

  async findMutualFollowers(
    userId: string,
    otherUserId: string,
    options?: FollowQueryOptions
  ): Promise<FollowUserSummary[]> {
    const limit = options?.limit ?? 20;

    // Find users that both userId and otherUserId follow
    const rows = await this.db
      .selectFrom('follows as f1')
      .innerJoin('follows as f2', 'f1.following_id', 'f2.following_id')
      .innerJoin('users', 'users.id', 'f1.following_id')
      .select([
        'users.id',
        'users.username',
        'users.full_name as fullName',
        'users.avatar_url as avatarUrl',
        'users.bio',
      ])
      .where('f1.follower_id', '=', userId)
      .where('f2.follower_id', '=', otherUserId)
      .where('users.deleted_at', 'is', null)
      .where('users.is_active', '=', true)
      .limit(limit)
      .execute();

    return rows.map((row) => ({
      id: row.id,
      username: row.username,
      fullName: row.fullName,
      avatarUrl: row.avatarUrl,
      bio: row.bio,
      isFollowing: true, // By definition, we're following mutual followers
    }));
  }

  async findSuggestions(
    userId: string,
    limit = 10
  ): Promise<FollowUserSummary[]> {
    // Find users that the people we follow also follow, but we don't follow yet
    // Using raw SQL count to avoid Kysely alias issues
    const rows = await this.db
      .selectFrom('follows as my_follows')
      .innerJoin(
        'follows as their_follows',
        'my_follows.following_id',
        'their_follows.follower_id'
      )
      .innerJoin('users', 'users.id', 'their_follows.following_id')
      .leftJoin('follows as already_following', (join) =>
        join
          .onRef('already_following.following_id', '=', 'users.id')
          .on('already_following.follower_id', '=', userId)
      )
      .select([
        'users.id',
        'users.username',
        'users.full_name as fullName',
        'users.avatar_url as avatarUrl',
        'users.bio',
      ])
      .where('my_follows.follower_id', '=', userId)
      .where('users.id', '!=', userId)
      .where('users.deleted_at', 'is', null)
      .where('users.is_active', '=', true)
      .where('already_following.id', 'is', null)
      .groupBy([
        'users.id',
        'users.username',
        'users.full_name',
        'users.avatar_url',
        'users.bio',
      ])
      .limit(limit)
      .execute();

    return rows.map((row) => ({
      id: row.id,
      username: row.username,
      fullName: row.fullName,
      avatarUrl: row.avatarUrl,
      bio: row.bio,
      isFollowing: false,
    }));
  }

  async isFollowingMany(
    followerId: string,
    followingIds: string[]
  ): Promise<Map<string, boolean>> {
    if (followingIds.length === 0) {
      return new Map();
    }

    const rows = await this.db
      .selectFrom('follows')
      .select('following_id')
      .where('follower_id', '=', followerId)
      .where('following_id', 'in', followingIds)
      .execute();

    const followingSet = new Set(rows.map((r) => r.following_id));
    const result = new Map<string, boolean>();

    for (const id of followingIds) {
      result.set(id, followingSet.has(id));
    }

    return result;
  }
}

/**
 * Create a PostgresFollowRepository instance
 */
export function createFollowRepository(
  db: Kysely<Database>
): IFollowRepository {
  return new PostgresFollowRepository(db);
}
