/**
 * User Test Fixtures
 *
 * Factory functions for creating test user entities.
 */

import { UserEntity } from '@blog/shared/domain';

let userCounter = 0;

/**
 * Default dummy bcrypt hash for testing
 */
export const DUMMY_PASSWORD_HASH =
  '$2b$10$abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVW';

/**
 * Options for creating a test user
 */
export interface CreateTestUserOptions {
  email?: string;
  username?: string;
  passwordHash?: string;
  fullName?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  socialLinks?: Record<string, string>;
  emailVerified?: boolean;
  isActive?: boolean;
  isAdmin?: boolean;
  spamScore?: number;
}

/**
 * Create a test user entity with optional overrides
 */
export function createTestUser(
  options: CreateTestUserOptions = {}
): UserEntity {
  userCounter++;
  const uniqueSuffix = `${Date.now()}_${userCounter}`;

  return UserEntity.create({
    email: options.email ?? `testuser${uniqueSuffix}@example.com`,
    username: options.username ?? `testuser${uniqueSuffix}`,
    passwordHash: options.passwordHash ?? DUMMY_PASSWORD_HASH,
    fullName: options.fullName ?? 'Test User',
    bio: options.bio ?? null,
    avatarUrl: options.avatarUrl ?? null,
    socialLinks: options.socialLinks ?? {},
    emailVerified: options.emailVerified ?? false,
    isActive: options.isActive ?? true,
    isAdmin: options.isAdmin ?? false,
    spamScore: options.spamScore ?? 0,
    deletedAt: null,
  });
}

/**
 * Create a verified admin user
 */
export function createTestAdminUser(
  options: CreateTestUserOptions = {}
): UserEntity {
  return createTestUser({
    ...options,
    isAdmin: true,
    emailVerified: true,
  });
}

/**
 * Create a verified regular user
 */
export function createTestVerifiedUser(
  options: CreateTestUserOptions = {}
): UserEntity {
  return createTestUser({
    ...options,
    emailVerified: true,
  });
}

/**
 * Create an inactive/blocked user
 */
export function createTestBlockedUser(
  options: CreateTestUserOptions = {}
): UserEntity {
  return createTestUser({
    ...options,
    isActive: false,
    spamScore: 10,
  });
}

/**
 * Create multiple test users
 */
export function createTestUsers(
  count: number,
  options: CreateTestUserOptions = {}
): UserEntity[] {
  return Array.from({ length: count }, () => createTestUser(options));
}

/**
 * Reset user counter (call in beforeEach for predictable usernames)
 */
export function resetUserCounter(): void {
  userCounter = 0;
}
