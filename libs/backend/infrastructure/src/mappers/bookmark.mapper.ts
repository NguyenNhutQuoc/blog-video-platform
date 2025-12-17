/**
 * Bookmark Entity Mapper
 *
 * Converts between database rows and domain entities.
 */

import type {
  BookmarkRow,
  NewBookmark,
  BookmarkUpdate,
} from '../database/types.js';
import { BookmarkEntity, type Bookmark } from '@blog/shared/domain';

// Type for the row after CamelCasePlugin transforms it
interface CamelCaseBookmarkRow {
  id: string;
  userId: string;
  postId: string;
  folderId: string;
  note: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Map database row to domain entity
 */
export function toDomainBookmark(row: BookmarkRow): BookmarkEntity {
  // Cast to camelCase type since CamelCasePlugin transforms the row
  const camelRow = row as unknown as CamelCaseBookmarkRow;

  const bookmark: Bookmark = {
    id: camelRow.id,
    userId: camelRow.userId,
    postId: camelRow.postId,
    folderId: camelRow.folderId,
    note: camelRow.note,
    createdAt: camelRow.createdAt,
    updatedAt: camelRow.updatedAt,
  };

  return BookmarkEntity.fromPersistence(bookmark);
}

/**
 * Map domain entity to database insert row
 */
export function toNewBookmarkRow(entity: BookmarkEntity): NewBookmark {
  const data = entity.toJSON();
  return {
    id: data.id,
    user_id: data.userId,
    post_id: data.postId,
    folder_id: data.folderId || '',
    note: data.note,
    created_at: data.createdAt,
    updated_at: data.updatedAt,
  };
}

/**
 * Map domain entity to database update row
 */
export function toBookmarkUpdateRow(entity: BookmarkEntity): BookmarkUpdate {
  const data = entity.toJSON();
  return {
    folder_id: data.folderId || '',
    note: data.note,
    updated_at: data.updatedAt,
  };
}
