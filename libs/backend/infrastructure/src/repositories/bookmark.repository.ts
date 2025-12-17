/**
 * PostgreSQL Bookmark Repository
 *
 * Implementation of IBookmarkRepository using Kysely.
 */

import type { Kysely } from 'kysely';
import type { Database } from '../database/types.js';
import type {
  IBookmarkRepository,
  BookmarkQueryOptions,
} from '@blog/backend/core';
import { BookmarkEntity } from '@blog/shared/domain';
import {
  toDomainBookmark,
  toNewBookmarkRow,
  toBookmarkUpdateRow,
} from '../mappers/bookmark.mapper.js';

export class PostgresBookmarkRepository implements IBookmarkRepository {
  constructor(private readonly db: Kysely<Database>) {}

  async findById(id: string): Promise<BookmarkEntity | null> {
    const row = await this.db
      .selectFrom('bookmarks')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();

    return row ? toDomainBookmark(row) : null;
  }

  async findByUserAndPost(
    userId: string,
    postId: string
  ): Promise<BookmarkEntity | null> {
    const row = await this.db
      .selectFrom('bookmarks')
      .selectAll()
      .where('user_id', '=', userId)
      .where('post_id', '=', postId)
      .executeTakeFirst();

    return row ? toDomainBookmark(row) : null;
  }

  async isPostBookmarkedByUser(
    userId: string,
    postId: string
  ): Promise<boolean> {
    const result = await this.db
      .selectFrom('bookmarks')
      .select(this.db.fn.count<number>('id').as('count'))
      .where('user_id', '=', userId)
      .where('post_id', '=', postId)
      .executeTakeFirst();

    return (result?.count ?? 0) > 0;
  }

  async isPostsBookmarkedByUser(
    userId: string,
    postIds: string[]
  ): Promise<Map<string, boolean>> {
    if (postIds.length === 0) {
      return new Map();
    }

    const rows = await this.db
      .selectFrom('bookmarks')
      .select('post_id')
      .where('user_id', '=', userId)
      .where('post_id', 'in', postIds)
      .execute();

    const bookmarkedSet = new Set(rows.map((r) => r.post_id));
    const result = new Map<string, boolean>();

    for (const id of postIds) {
      result.set(id, bookmarkedSet.has(id));
    }

    return result;
  }

  async findByUserId(
    userId: string,
    options?: BookmarkQueryOptions
  ): Promise<BookmarkEntity[]> {
    const limit = options?.limit ?? 20;

    let query = this.db
      .selectFrom('bookmarks')
      .selectAll()
      .where('user_id', '=', userId);

    // Optional folder filter
    if (options?.folderId) {
      query = query.where('folder_id', '=', options.folderId);
    }

    // Cursor pagination by created_at (ISO timestamp)
    if (options?.cursor) {
      query = query.where('created_at', '<', new Date(options.cursor));
    }

    query = query.orderBy('created_at', 'desc').limit(limit);

    const rows = await query.execute();
    return rows.map(toDomainBookmark);
  }

  async findByFolderId(
    folderId: string,
    options?: BookmarkQueryOptions
  ): Promise<BookmarkEntity[]> {
    const limit = options?.limit ?? 20;

    let query = this.db
      .selectFrom('bookmarks')
      .selectAll()
      .where('folder_id', '=', folderId);

    // Cursor pagination by created_at (ISO timestamp)
    if (options?.cursor) {
      query = query.where('created_at', '<', new Date(options.cursor));
    }

    query = query.orderBy('created_at', 'desc').limit(limit);

    const rows = await query.execute();
    return rows.map(toDomainBookmark);
  }

  async countByUserId(userId: string): Promise<number> {
    const result = await this.db
      .selectFrom('bookmarks')
      .select(this.db.fn.count<number>('id').as('count'))
      .where('user_id', '=', userId)
      .executeTakeFirst();

    return result?.count ?? 0;
  }

  async countByFolderId(folderId: string): Promise<number> {
    const result = await this.db
      .selectFrom('bookmarks')
      .select(this.db.fn.count<number>('id').as('count'))
      .where('folder_id', '=', folderId)
      .executeTakeFirst();

    return result?.count ?? 0;
  }

  async save(bookmark: BookmarkEntity): Promise<void> {
    await this.db
      .insertInto('bookmarks')
      .values(toNewBookmarkRow(bookmark))
      .execute();
  }

  async update(bookmark: BookmarkEntity): Promise<void> {
    await this.db
      .updateTable('bookmarks')
      .set(toBookmarkUpdateRow(bookmark))
      .where('id', '=', bookmark.toJSON().id)
      .execute();
  }

  async delete(userId: string, postId: string): Promise<void> {
    await this.db
      .deleteFrom('bookmarks')
      .where('user_id', '=', userId)
      .where('post_id', '=', postId)
      .execute();
  }

  async deleteById(id: string): Promise<void> {
    await this.db.deleteFrom('bookmarks').where('id', '=', id).execute();
  }
}
