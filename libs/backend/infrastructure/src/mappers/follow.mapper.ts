/**
 * Follow Entity Mapper
 *
 * Converts between database rows and domain entities.
 */

import type { FollowRow, NewFollow } from '../database/types.js';
import { FollowEntity, type Follow } from '@blog/shared/domain';

// Type for the row after CamelCasePlugin transforms it
interface CamelCaseFollowRow {
  id: string;
  followerId: string;
  followingId: string;
  createdAt: Date;
}

/**
 * Map database row to domain entity
 */
export function toDomainFollow(row: FollowRow): FollowEntity {
  // Cast to camelCase type since CamelCasePlugin transforms the row
  const camelRow = row as unknown as CamelCaseFollowRow;

  const follow: Follow = {
    id: camelRow.id,
    followerId: camelRow.followerId,
    followingId: camelRow.followingId,
    createdAt: camelRow.createdAt,
  };

  return FollowEntity.fromPersistence(follow);
}

/**
 * Map domain entity to database insert row
 */
export function toNewFollowRow(entity: FollowEntity): NewFollow {
  const data = entity.toJSON();
  return {
    id: data.id,
    follower_id: data.followerId,
    following_id: data.followingId,
    created_at: data.createdAt,
  };
}
