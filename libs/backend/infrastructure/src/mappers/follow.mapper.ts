/**
 * Follow Entity Mapper
 *
 * Converts between database rows and domain entities.
 */

import type { FollowRow, NewFollow } from '../database/types.js';
import { FollowEntity, type Follow } from '@blog/shared/domain';

/**
 * Map database row to domain entity
 */
export function toDomainFollow(row: FollowRow): FollowEntity {
  const follow: Follow = {
    id: row.id,
    followerId: row.follower_id,
    followingId: row.following_id,
    createdAt: row.created_at,
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
