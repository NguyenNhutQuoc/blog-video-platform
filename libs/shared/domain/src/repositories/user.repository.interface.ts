import type { UserEntity } from '../entities/user.entity.js';

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
}

/**
 * User Query Options
 */
export interface UserQueryOptions {
  includeDeleted?: boolean;
  includeInactive?: boolean;
}
