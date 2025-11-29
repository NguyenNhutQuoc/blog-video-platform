/**
 * Tag Entity Mapper
 *
 * Converts between database rows and domain entities.
 */

import type { TagRow, NewTag, TagUpdate } from '../database/types.js';
import { TagEntity, type Tag } from '@blog/shared/domain';

/**
 * Map database row to domain entity
 */
export function toDomainTag(row: TagRow): TagEntity {
  const tag: Tag = {
    id: row.id,
    name: row.name,
    slug: row.slug,
    usageCount: row.usage_count,
    createdAt: row.created_at,
    updatedAt: row.created_at, // Schema doesn't have updated_at
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
