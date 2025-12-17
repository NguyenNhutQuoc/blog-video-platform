/**
 * Bookmark Folder Entity Mapper
 *
 * Converts between database rows and domain entities.
 */

import type {
  BookmarkFolderRow,
  NewBookmarkFolder,
  BookmarkFolderUpdate,
} from '../database/types.js';
import { BookmarkFolderEntity, type BookmarkFolder } from '@blog/shared/domain';

// Type for the row after CamelCasePlugin transforms it
interface CamelCaseBookmarkFolderRow {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  color: string | null;
  sortOrder: number;
  isDefault: boolean;
  bookmarkCount: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Map database row to domain entity
 */
export function toDomainBookmarkFolder(
  row: BookmarkFolderRow
): BookmarkFolderEntity {
  // Cast to camelCase type since CamelCasePlugin transforms the row
  const camelRow = row as unknown as CamelCaseBookmarkFolderRow;

  const folder: BookmarkFolder = {
    id: camelRow.id,
    userId: camelRow.userId,
    name: camelRow.name,
    description: camelRow.description,
    color: camelRow.color,
    sortOrder: camelRow.sortOrder,
    isDefault: camelRow.isDefault,
    bookmarkCount: camelRow.bookmarkCount,
    createdAt: camelRow.createdAt,
    updatedAt: camelRow.updatedAt,
  };

  return BookmarkFolderEntity.fromPersistence(folder);
}

/**
 * Map domain entity to database insert row
 */
export function toNewBookmarkFolderRow(
  entity: BookmarkFolderEntity
): NewBookmarkFolder {
  const data = entity.toJSON();
  return {
    id: data.id,
    user_id: data.userId,
    name: data.name,
    description: data.description,
    color: data.color,
    sort_order: data.sortOrder,
    is_default: data.isDefault,
    bookmark_count: data.bookmarkCount,
    created_at: data.createdAt,
    updated_at: data.updatedAt,
  };
}

/**
 * Map domain entity to database update row
 */
export function toBookmarkFolderUpdateRow(
  entity: BookmarkFolderEntity
): BookmarkFolderUpdate {
  const data = entity.toJSON();
  return {
    name: data.name,
    description: data.description,
    color: data.color,
    sort_order: data.sortOrder,
    bookmark_count: data.bookmarkCount,
    updated_at: data.updatedAt,
  };
}
