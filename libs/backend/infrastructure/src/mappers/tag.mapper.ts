/**
 * Tag Entity Mapper
 *
 * Converts between database rows and domain entities.
 */

import type { TagRow, NewTag, TagUpdate } from '../database/types.js';
import { TagEntity, type Tag } from '@blog/shared/domain';

// Type for the row after CamelCasePlugin transforms it
interface CamelCaseTagRow {
  id: string;
  name: string;
  slug: string;
  usageCount: number;
  createdAt: Date;
}

/**
 * Map database row to domain entity
 */
export function toDomainTag(row: TagRow): TagEntity {
  // Cast to camelCase type since CamelCasePlugin transforms the row
  const camelRow = row as unknown as CamelCaseTagRow;

  const tag: Tag = {
    id: camelRow.id,
    name: camelRow.name,
    slug: camelRow.slug,
    usageCount: camelRow.usageCount,
    createdAt: camelRow.createdAt,
    updatedAt: camelRow.createdAt, // Schema doesn't have updated_at
  };

  return TagEntity.fromPersistence(tag);
}

/**
 * Map domain entity to database insert row
 */
export function toNewTagRow(entity: TagEntity): NewTag {
  const data = entity.toJSON();
  return {
    id: data.id,
    name: data.name,
    slug: data.slug,
    usage_count: data.usageCount,
    created_at: data.createdAt,
  };
}

/**
 * Map domain entity to database update row
 */
export function toTagUpdateRow(entity: TagEntity): TagUpdate {
  const data = entity.toJSON();
  return {
    name: data.name,
    slug: data.slug,
    usage_count: data.usageCount,
  };
}
