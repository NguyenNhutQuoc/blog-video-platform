/**
 * User Entity Mapper
 *
 * Converts between database rows and domain entities.
 * Note: We use snake_case for database columns as Kysely CamelCasePlugin
 * transforms them at query time, but our types remain in snake_case.
 */

import type { UserRow, NewUser, UserUpdate } from '../database/types.js';
import { UserEntity, type User } from '@blog/shared/domain';

/**
 * Map database row to domain entity
 */
export function toDomainUser(row: UserRow): UserEntity {
  const user: User = {
    id: row.id,
    email: row.email,
    username: row.username,
    passwordHash: row.password_hash,
    fullName: row.full_name ?? null,
    bio: row.bio ?? null,
    avatarUrl: row.avatar_url ?? null,
    socialLinks: (row.social_links as Record<string, string>) ?? {},
    emailVerified: row.email_verified,
    isActive: row.is_active,
    isAdmin: row.is_admin,
    spamScore: row.spam_score,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at ?? null,
  };

  return new UserEntity(user);
}

/**
 * Map domain entity to database insert row
 */
export function toNewUserRow(entity: UserEntity): NewUser {
  const data = entity.toJSON();
  return {
    id: data.id,
    email: data.email,
    username: data.username,
    password_hash: data.passwordHash,
    full_name: data.fullName,
    bio: data.bio,
    avatar_url: data.avatarUrl,
    social_links: data.socialLinks,
    email_verified: data.emailVerified,
    is_active: data.isActive,
    is_admin: data.isAdmin,
    spam_score: data.spamScore,
    created_at: data.createdAt,
    updated_at: data.updatedAt,
    deleted_at: data.deletedAt,
  };
}

/**
 * Map domain entity to database update row
 */
export function toUserUpdateRow(entity: UserEntity): UserUpdate {
  const data = entity.toJSON();
  return {
    email: data.email,
    username: data.username,
    password_hash: data.passwordHash,
    full_name: data.fullName,
    bio: data.bio,
    avatar_url: data.avatarUrl,
    social_links: data.socialLinks,
    email_verified: data.emailVerified,
    is_active: data.isActive,
    is_admin: data.isAdmin,
    spam_score: data.spamScore,
    updated_at: new Date(),
    deleted_at: data.deletedAt,
  };
}
