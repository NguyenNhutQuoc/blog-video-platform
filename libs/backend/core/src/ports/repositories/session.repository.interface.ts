/**
 * Session Repository Interface (Port)
 *
 * Defines the contract for session persistence operations.
 */

import type { SessionEntity } from '@blog/shared/domain';

export interface ISessionRepository {
  /**
   * Find session by ID
   */
  findById(id: string): Promise<SessionEntity | null>;

  /**
   * Find session by refresh token hash
   */
  findByTokenHash(tokenHash: string): Promise<SessionEntity | null>;

  /**
   * Find all sessions for a user
   */
  findByUserId(userId: string): Promise<SessionEntity[]>;

  /**
   * Save session (create or update)
   */
  save(session: SessionEntity): Promise<void>;

  /**
   * Delete session by ID
   */
  delete(id: string): Promise<void>;

  /**
   * Delete all sessions for a user (logout all devices)
   */
  deleteAllForUser(userId: string): Promise<void>;

  /**
   * Delete expired sessions
   */
  deleteExpired(): Promise<number>;

  /**
   * Count active sessions for a user
   */
  countByUserId(userId: string): Promise<number>;
}
