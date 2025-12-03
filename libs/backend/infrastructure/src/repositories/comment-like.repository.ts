/**
 * PostgreSQL Comment Like Repository
 *
 * Implements ICommentLikeRepository using Kysely.
 */

import type { Kysely } from 'kysely';
import { CommentLikeEntity } from '@blog/shared/domain';
import type {
  ICommentLikeRepository,
  CommentLikeQueryOptions,
} from '@blog/backend/core';
import type { Database, CommentLikeRow } from '../database/types.js';

export class PostgresCommentLikeRepository implements ICommentLikeRepository {
  constructor(private readonly db: Kysely<Database>) {}

  /**
   * Map database row to entity
   */
  private mapToEntity(row: CommentLikeRow): CommentLikeEntity {
    return CommentLikeEntity.fromPersistence({
      userId: row.user_id,
      commentId: row.comment_id,
      createdAt: row.created_at,
    });
  }

  async findByUserAndComment(
    userId: string,
    commentId: string
  ): Promise<CommentLikeEntity | null> {
    const row = await this.db
      .selectFrom('comment_likes')
      .selectAll()
      .where('user_id', '=', userId)
      .where('comment_id', '=', commentId)
      .executeTakeFirst();

    return row ? this.mapToEntity(row) : null;
  }

  async isCommentLikedByUser(
    userId: string,
    commentId: string
  ): Promise<boolean> {
    const row = await this.db
      .selectFrom('comment_likes')
      .select('user_id')
      .where('user_id', '=', userId)
      .where('comment_id', '=', commentId)
      .executeTakeFirst();

    return !!row;
  }

  async isCommentsLikedByUser(
    userId: string,
    commentIds: string[]
  ): Promise<Map<string, boolean>> {
    if (commentIds.length === 0) {
      return new Map();
    }

    const rows = await this.db
      .selectFrom('comment_likes')
      .select('comment_id')
      .where('user_id', '=', userId)
      .where('comment_id', 'in', commentIds)
      .execute();

    const likedSet = new Set(rows.map((r) => r.comment_id));
    const result = new Map<string, boolean>();

    for (const id of commentIds) {
      result.set(id, likedSet.has(id));
    }

    return result;
  }

  async findByCommentId(
    commentId: string,
    options?: CommentLikeQueryOptions
  ): Promise<CommentLikeEntity[]> {
    let query = this.db
      .selectFrom('comment_likes')
      .selectAll()
      .where('comment_id', '=', commentId)
      .orderBy('created_at', 'desc');

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const rows = await query.execute();
    return rows.map((row) => this.mapToEntity(row));
  }

  async countByCommentId(commentId: string): Promise<number> {
    const result = await this.db
      .selectFrom('comment_likes')
      .select((eb) => eb.fn.countAll<number>().as('count'))
      .where('comment_id', '=', commentId)
      .executeTakeFirst();

    return Number(result?.count ?? 0);
  }

  async save(like: CommentLikeEntity): Promise<void> {
    const data = like.toJSON();

    await this.db
      .insertInto('comment_likes')
      .values({
        user_id: data.userId,
        comment_id: data.commentId,
        created_at: data.createdAt,
      })
      .execute();
  }

  async delete(userId: string, commentId: string): Promise<void> {
    await this.db
      .deleteFrom('comment_likes')
      .where('user_id', '=', userId)
      .where('comment_id', '=', commentId)
      .execute();
  }
}
