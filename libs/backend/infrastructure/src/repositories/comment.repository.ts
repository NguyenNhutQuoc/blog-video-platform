/**
 * PostgreSQL Comment Repository
 *
 * Implementation of ICommentRepository using Kysely.
 */

import type { Kysely } from 'kysely';
import type { Database } from '../database/types.js';
import type {
  ICommentRepository,
  CommentQueryOptions,
  CommentModerationOptions,
} from '@blog/backend/core';
import { CommentEntity } from '@blog/shared/domain';
import {
  toDomainComment,
  toNewCommentRow,
  toCommentUpdateRow,
} from '../mappers/comment.mapper.js';

export class PostgresCommentRepository implements ICommentRepository {
  constructor(private readonly db: Kysely<Database>) {}

  async findById(id: string): Promise<CommentEntity | null> {
    const row = await this.db
      .selectFrom('comments')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();

    return row ? toDomainComment(row) : null;
  }

  async findByPostId(
    postId: string,
    options?: CommentQueryOptions
  ): Promise<CommentEntity[]> {
    const limit = options?.limit ?? 20;
    const orderBy = options?.orderBy ?? 'createdAt';
    const orderDir = options?.orderDir ?? 'desc';

    let query = this.db
      .selectFrom('comments')
      .selectAll()
      .where('post_id', '=', postId);

    // Filter by status
    if (options?.status) {
      if (Array.isArray(options.status)) {
        query = query.where('status', 'in', options.status);
      } else {
        query = query.where('status', '=', options.status);
      }
    }

    // Include deleted or not
    if (!options?.includeDeleted) {
      query = query.where('deleted_at', 'is', null);
    }

    // Order
    const orderColumn = orderBy === 'likeCount' ? 'like_count' : 'created_at';
    query = query.orderBy(orderColumn, orderDir);

    // Limit
    query = query.limit(limit);

    const rows = await query.execute();
    return rows.map(toDomainComment);
  }

  async findReplies(commentId: string): Promise<CommentEntity[]> {
    const rows = await this.db
      .selectFrom('comments')
      .selectAll()
      .where('parent_id', '=', commentId)
      .where('deleted_at', 'is', null)
      .where('status', '=', 'approved')
      .orderBy('created_at', 'asc')
      .execute();

    return rows.map(toDomainComment);
  }

  async findByUserId(
    userId: string,
    options?: CommentQueryOptions
  ): Promise<CommentEntity[]> {
    const limit = options?.limit ?? 20;

    let query = this.db
      .selectFrom('comments')
      .selectAll()
      .where('user_id', '=', userId);

    if (!options?.includeDeleted) {
      query = query.where('deleted_at', 'is', null);
    }

    query = query.orderBy('created_at', 'desc').limit(limit);

    const rows = await query.execute();
    return rows.map(toDomainComment);
  }

  async findPendingModeration(
    options?: CommentModerationOptions
  ): Promise<CommentEntity[]> {
    const limit = options?.limit ?? 20;
    const orderBy = options?.orderBy ?? 'createdAt';
    const orderDir = options?.orderDir ?? 'asc';

    const orderColumn = orderBy === 'postId' ? 'post_id' : 'created_at';

    const rows = await this.db
      .selectFrom('comments')
      .selectAll()
      .where('status', '=', 'pending_review')
      .where('deleted_at', 'is', null)
      .orderBy(orderColumn, orderDir)
      .limit(limit)
      .execute();

    return rows.map(toDomainComment);
  }

  async save(comment: CommentEntity): Promise<void> {
    const data = comment.toJSON();

    // Check if comment exists
    const existing = await this.db
      .selectFrom('comments')
      .select('id')
      .where('id', '=', data.id)
      .executeTakeFirst();

    if (existing) {
      // Update
      await this.db
        .updateTable('comments')
        .set(toCommentUpdateRow(comment))
        .where('id', '=', data.id)
        .execute();
    } else {
      // Insert
      await this.db
        .insertInto('comments')
        .values(toNewCommentRow(comment))
        .execute();
    }
  }

  async softDelete(id: string): Promise<void> {
    await this.db
      .updateTable('comments')
      .set({
        deleted_at: new Date(),
        updated_at: new Date(),
      })
      .where('id', '=', id)
      .execute();
  }

  async hardDelete(id: string): Promise<void> {
    // First delete all replies
    await this.db.deleteFrom('comments').where('parent_id', '=', id).execute();

    // Then delete the comment itself
    await this.db.deleteFrom('comments').where('id', '=', id).execute();
  }

  async countByPost(postId: string): Promise<number> {
    const result = await this.db
      .selectFrom('comments')
      .select(this.db.fn.count<number>('id').as('count'))
      .where('post_id', '=', postId)
      .where('deleted_at', 'is', null)
      .where('status', '=', 'approved')
      .executeTakeFirst();

    return result?.count ?? 0;
  }

  async countByUser(userId: string): Promise<number> {
    const result = await this.db
      .selectFrom('comments')
      .select(this.db.fn.count<number>('id').as('count'))
      .where('user_id', '=', userId)
      .where('deleted_at', 'is', null)
      .executeTakeFirst();

    return result?.count ?? 0;
  }

  async countPendingModeration(): Promise<number> {
    const result = await this.db
      .selectFrom('comments')
      .select(this.db.fn.count<number>('id').as('count'))
      .where('status', '=', 'pending_review')
      .where('deleted_at', 'is', null)
      .executeTakeFirst();

    return result?.count ?? 0;
  }

  async findRootsByPostId(
    postId: string,
    options?: CommentQueryOptions
  ): Promise<CommentEntity[]> {
    const limit = options?.limit ?? 20;
    const orderBy = options?.orderBy ?? 'createdAt';
    const orderDir = options?.orderDir ?? 'desc';

    let query = this.db
      .selectFrom('comments')
      .selectAll()
      .where('post_id', '=', postId)
      .where('parent_id', 'is', null); // Root comments only

    // Filter by status
    if (options?.status) {
      if (Array.isArray(options.status)) {
        query = query.where('status', 'in', options.status);
      } else {
        query = query.where('status', '=', options.status);
      }
    }

    // Include deleted or not
    if (!options?.includeDeleted) {
      query = query.where('deleted_at', 'is', null);
    }

    // Order
    const orderColumn = orderBy === 'likeCount' ? 'like_count' : 'created_at';
    query = query.orderBy(orderColumn, orderDir);

    // Limit
    query = query.limit(limit);

    const rows = await query.execute();
    return rows.map(toDomainComment);
  }

  async batchUpdateStatus(ids: string[], status: string): Promise<void> {
    if (ids.length === 0) return;

    await this.db
      .updateTable('comments')
      .set({
        status,
        updated_at: new Date(),
      })
      .where('id', 'in', ids)
      .execute();
  }
}

/**
 * Create a PostgresCommentRepository instance
 */
export function createCommentRepository(
  db: Kysely<Database>
): ICommentRepository {
  return new PostgresCommentRepository(db);
}
