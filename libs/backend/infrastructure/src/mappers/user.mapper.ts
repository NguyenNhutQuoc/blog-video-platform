/**
 * User Entity Mapper
 *
 * Converts between database rows and domain entities.
 * Note: Kysely CamelCasePlugin transforms column names automatically.
 * DB snake_case -> JS camelCase at query time.
 */

import type { UserRow, NewUser, UserUpdate } from '../database/types.js';
import { UserEntity, type User } from '@blog/shared/domain';

function sanitizeSocialLinks(
  links?: Record<string, unknown> | null
): Record<string, string> {
  if (!links) {
    return {};
  }

  const sanitized: Record<string, string> = {};
  for (const [key, value] of Object.entries(links)) {
    if (typeof value === 'string') {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

// Type for the row after CamelCasePlugin transforms it
interface CamelCaseUserRow {
  id: string;
  email: string;
  username: string;
  passwordHash: string;
  fullName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  socialLinks: Record<string, unknown> | null;
  emailVerified: boolean;
  isActive: boolean;
  isAdmin: boolean;
  spamScore: number;
  failedLoginAttempts: number;
  lockedUntil: Date | null;
  lastLoginAt: Date | null;
  passwordChangedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

/**
 * Map database row to domain entity
 * Note: Kysely CamelCasePlugin already converts snake_case to camelCase
 */
export function toDomainUser(row: UserRow): UserEntity {
  // Cast to camelCase type since CamelCasePlugin transforms the row
  const camelRow = row as unknown as CamelCaseUserRow;

  const user: User = {
    id: camelRow.id,
    email: camelRow.email,
    username: camelRow.username,
    passwordHash: camelRow.passwordHash,
    fullName: camelRow.fullName ?? null,
    bio: camelRow.bio ?? null,
    avatarUrl: camelRow.avatarUrl ?? null,
    socialLinks: sanitizeSocialLinks(camelRow.socialLinks),
    emailVerified: camelRow.emailVerified,
    isActive: camelRow.isActive,
    isAdmin: camelRow.isAdmin,
    spamScore: camelRow.spamScore,
    failedLoginAttempts: camelRow.failedLoginAttempts ?? 0,
    lockedUntil: camelRow.lockedUntil ?? null,
    lastLoginAt: camelRow.lastLoginAt ?? null,
    passwordChangedAt: camelRow.passwordChangedAt ?? null,
    createdAt: camelRow.createdAt,
    updatedAt: camelRow.updatedAt,
    deletedAt: camelRow.deletedAt ?? null,
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
    social_links: sanitizeSocialLinks(data.socialLinks),
    email_verified: data.emailVerified,
    is_active: data.isActive,
    is_admin: data.isAdmin,
    spam_score: data.spamScore,
    failed_login_attempts: data.failedLoginAttempts ?? 0,
    locked_until: data.lockedUntil,
    last_login_at: data.lastLoginAt,
    password_changed_at: data.passwordChangedAt,
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
    social_links: sanitizeSocialLinks(data.socialLinks),
    email_verified: data.emailVerified,
    is_active: data.isActive,
    is_admin: data.isAdmin,
    spam_score: data.spamScore,
    failed_login_attempts: data.failedLoginAttempts ?? 0,
    locked_until: data.lockedUntil,
    last_login_at: data.lastLoginAt,
    password_changed_at: data.passwordChangedAt,
    updated_at: new Date(),
    deleted_at: data.deletedAt,
  };
}
