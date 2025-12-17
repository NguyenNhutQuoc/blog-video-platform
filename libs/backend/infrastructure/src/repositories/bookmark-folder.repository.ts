/**
 * PostgreSQL Bookmark Folder Repository
 *
 * Implementation of IBookmarkFolderRepository using Kysely.
 */

import type { Kysely } from 'kysely';
import type { Database } from '../database/types.js';
import type { IBookmarkFolderRepository } from '@blog/backend/core';
import { BookmarkFolderEntity } from '@blog/shared/domain';
import {
  toDomainBookmarkFolder,
  toNewBookmarkFolderRow,
  toBookmarkFolderUpdateRow,
} from '../mappers/bookmark-folder.mapper.js';
import { sql } from 'kysely';

export class PostgresBookmarkFolderRepository
  implements IBookmarkFolderRepository
{
  constructor(private readonly db: Kysely<Database>) {}

  async findById(id: string): Promise<BookmarkFolderEntity | null> {
    const row = await this.db
      .selectFrom('bookmark_folders')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();

    return row ? toDomainBookmarkFolder(row) : null;
  }

  async findByUserId(userId: string): Promise<BookmarkFolderEntity[]> {
    const rows = await this.db
      .selectFrom('bookmark_folders')
      .selectAll()
      .where('user_id', '=', userId)
      .orderBy('sort_order', 'asc')
      .orderBy('created_at', 'asc')
      .execute();

    return rows.map(toDomainBookmarkFolder);
  }

  async findDefaultFolder(
    userId: string
  ): Promise<BookmarkFolderEntity | null> {
    const row = await this.db
      .selectFrom('bookmark_folders')
      .selectAll()
      .where('user_id', '=', userId)
      .where('is_default', '=', true)
      .executeTakeFirst();

    return row ? toDomainBookmarkFolder(row) : null;
  }

  async existsByUserIdAndName(userId: string, name: string): Promise<boolean> {
    const result = await this.db
      .selectFrom('bookmark_folders')
      .select(this.db.fn.count<number>('id').as('count'))
      .where('user_id', '=', userId)
      .where(sql`LOWER(name)`, '=', name.toLowerCase())
      .executeTakeFirst();

    return (result?.count ?? 0) > 0;
  }

  async save(folder: BookmarkFolderEntity): Promise<void> {
    await this.db
      .insertInto('bookmark_folders')
      .values(toNewBookmarkFolderRow(folder))
      .execute();
  }

  async update(folder: BookmarkFolderEntity): Promise<void> {
    await this.db
      .updateTable('bookmark_folders')
      .set(toBookmarkFolderUpdateRow(folder))
      .where('id', '=', folder.toJSON().id)
      .execute();
  }

  async delete(id: string): Promise<void> {
    await this.db.deleteFrom('bookmark_folders').where('id', '=', id).execute();
  }

  async countByUserId(userId: string): Promise<number> {
    const result = await this.db
      .selectFrom('bookmark_folders')
      .select(this.db.fn.count<number>('id').as('count'))
      .where('user_id', '=', userId)
      .executeTakeFirst();

    return result?.count ?? 0;
  }
}
