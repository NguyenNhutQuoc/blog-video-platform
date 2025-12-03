/**
 * Like Entity Mapper
 *
 * Converts between database rows and domain entities.
 */

import type { LikeRow, NewLike } from '../database/types.js';
import { LikeEntity, type Like } from '@blog/shared/domain';

// Type for the row after CamelCasePlugin transforms it
interface CamelCaseLikeRow {
  id: string;
  userId: string;
  postId: string;
  createdAt: Date;
}

/**
 * Map database row to domain entity
 */
export function toDomainLike(row: LikeRow): LikeEntity {
  // Cast to camelCase type since CamelCasePlugin transforms the row
  const camelRow = row as unknown as CamelCaseLikeRow;

  const like: Like = {
    id: camelRow.id,
    userId: camelRow.userId,
    postId: camelRow.postId,
    createdAt: camelRow.createdAt,
  };

  return LikeEntity.fromPersistence(like);
}

/**
 * Map domain entity to database insert row
 */
export function toNewLikeRow(entity: LikeEntity): NewLike {
  const data = entity.toJSON();
  return {
    id: data.id,
    user_id: data.userId,
    post_id: data.postId,
    created_at: data.createdAt,
  };
}
