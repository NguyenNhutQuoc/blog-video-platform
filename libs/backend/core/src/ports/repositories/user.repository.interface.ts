import type { UserEntity } from '@blog/shared/domain';

/**
 * User Repository Interface (Port)
 *
 * Defines the contract for user persistence operations.
 * This is a port in the Hexagonal Architecture - implementations
 * will be adapters (e.g., PostgresUserRepository).
 */
export interface IUserRepository {
  /**
   * Find user by ID
   */
  findById(id: string): Promise<UserEntity | null>;

  /**
   * Find user by email
   */
  findByEmail(email: string): Promise<UserEntity | null>;

  /**
   * Find user by username
   */
  findByUsername(username: string): Promise<UserEntity | null>;

  /**
   * Check if email exists
   */
  emailExists(email: string): Promise<boolean>;

  /**
   * Check if username exists
   */
  usernameExists(username: string): Promise<boolean>;

  /**
   * Save user (create or update)
   */
  save(user: UserEntity): Promise<void>;

  /**
   * Delete user (soft delete)
   */
  softDelete(id: string): Promise<void>;

  /**
   * Find users by IDs
   */
  findByIds(ids: string[]): Promise<UserEntity[]>;

  /**
   * Find users with spam score above threshold
   */
  findSpammers(threshold?: number): Promise<UserEntity[]>;

  /**
   * Count total active users
   */
  countActive(): Promise<number>;

  // =====================================================
  // ACCOUNT LOCKOUT METHODS
  // =====================================================

  /**
   * Lock a user account until a specified date
   */
  lockAccount(userId: string, until: Date): Promise<void>;

  /**
   * Unlock a user account and reset failed login attempts
   */
  unlockAccount(userId: string): Promise<void>;

  /**
   * Increment failed login attempts for a user
   */
  incrementFailedAttempts(userId: string): Promise<number>;

  /**
   * Reset failed login attempts (on successful login)
   */
  resetFailedAttempts(userId: string): Promise<void>;

  /**
   * Record successful login (update lastLoginAt, reset failed attempts)
   */
  recordSuccessfulLogin(userId: string): Promise<void>;
}

/**
 * User Query Options
 */
export interface UserQueryOptions {
  includeDeleted?: boolean;
  includeInactive?: boolean;
}
