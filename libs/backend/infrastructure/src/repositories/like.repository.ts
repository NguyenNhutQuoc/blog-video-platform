/**
 * PostgreSQL Like Repository
 *
 * Implementation of ILikeRepository using Kysely.
 */

import type { Kysely } from 'kysely';
import type { Database } from '../database/types.js';
import type { ILikeRepository, LikeQueryOptions } from '@blog/backend/core';
import { LikeEntity } from '@blog/shared/domain';
import { toDomainLike, toNewLikeRow } from '../mappers/like.mapper.js';

export class PostgresLikeRepository implements ILikeRepository {
  constructor(private readonly db: Kysely<Database>) {}

  async findById(id: string): Promise<LikeEntity | null> {
    const row = await this.db
      .selectFrom('likes')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();

    return row ? toDomainLike(row) : null;
  }

  async findByUserAndPost(
    userId: string,
    postId: string
  ): Promise<LikeEntity | null> {
    const row = await this.db
      .selectFrom('likes')
      .selectAll()
      .where('user_id', '=', userId)
      .where('post_id', '=', postId)
      .executeTakeFirst();

    return row ? toDomainLike(row) : null;
  }

  async isPostLikedByUser(userId: string, postId: string): Promise<boolean> {
    const result = await this.db
      .selectFrom('likes')
      .select(this.db.fn.count<number>('id').as('count'))
      .where('user_id', '=', userId)
      .where('post_id', '=', postId)
      .executeTakeFirst();

    return (result?.count ?? 0) > 0;
  }

  async isPostsLikedByUser(
    userId: string,
    postIds: string[]
  ): Promise<Map<string, boolean>> {
    if (postIds.length === 0) {
      return new Map();
    }

    const rows = await this.db
      .selectFrom('likes')
      .select('post_id')
      .where('user_id', '=', userId)
      .where('post_id', 'in', postIds)
      .execute();

    const likedSet = new Set(rows.map((r) => r.post_id));
    const result = new Map<string, boolean>();

    for (const id of postIds) {
      result.set(id, likedSet.has(id));
    }

    return result;
  }

  async findByPostId(
    postId: string,
    options?: LikeQueryOptions
  ): Promise<LikeEntity[]> {
    const limit = options?.limit ?? 20;

    let query = this.db
      .selectFrom('likes')
      .selectAll()
      .where('post_id', '=', postId)
      .orderBy('created_at', 'desc')
      .limit(limit);

    if (options?.cursor) {
      query = query.where('id', '<', options.cursor);
    }

    const rows = await query.execute();
    return rows.map(toDomainLike);
  }

  async findByUserId(
    userId: string,
    options?: LikeQueryOptions
  ): Promise<LikeEntity[]> {
    const limit = options?.limit ?? 20;

    let query = this.db
      .selectFrom('likes')
      .selectAll()
      .where('user_id', '=', userId)
      .orderBy('created_at', 'desc')
      .limit(limit);

    if (options?.cursor) {
      query = query.where('id', '<', options.cursor);
    }

    const rows = await query.execute();
    return rows.map(toDomainLike);
  }

  async countByPostId(postId: string): Promise<number> {
    const result = await this.db
      .selectFrom('likes')
      .select(this.db.fn.count<number>('id').as('count'))
      .where('post_id', '=', postId)
      .executeTakeFirst();

    return result?.count ?? 0;
  }

  async countByUserId(userId: string): Promise<number> {
    const result = await this.db
      .selectFrom('likes')
      .select(this.db.fn.count<number>('id').as('count'))
      .where('user_id', '=', userId)
      .executeTakeFirst();

    return result?.count ?? 0;
  }

  async save(like: LikeEntity): Promise<void> {
    await this.db.insertInto('likes').values(toNewLikeRow(like)).execute();
  }

  async delete(userId: string, postId: string): Promise<void> {
    await this.db
      .deleteFrom('likes')
      .where('user_id', '=', userId)
      .where('post_id', '=', postId)
      .execute();
  }

  async deleteById(id: string): Promise<void> {
    await this.db.deleteFrom('likes').where('id', '=', id).execute();
  }
}

/**
 * Create a PostgresLikeRepository instance
 */
export function createLikeRepository(db: Kysely<Database>): ILikeRepository {
  return new PostgresLikeRepository(db);
}
