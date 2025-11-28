/**
 * Login Attempt Repository Interface
 *
 * Port interface for tracking login attempts (brute force protection).
 */

export interface LoginAttempt {
  id: string;
  email: string;
  ipAddress: string | null;
  userAgent: string | null;
  success: boolean;
  failureReason: string | null;
  createdAt: Date;
}

export interface CreateLoginAttemptInput {
  email: string;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  failureReason?: string;
}

export interface LoginAttemptStats {
  totalAttempts: number;
  failedAttempts: number;
  lastAttemptAt: Date | null;
}

export interface ILoginAttemptRepository {
  /**
   * Record a login attempt
   */
  create(input: CreateLoginAttemptInput): Promise<LoginAttempt>;

  /**
   * Count failed attempts for an email within a time window
   */
  countFailedAttempts(email: string, windowMinutes: number): Promise<number>;

  /**
   * Count failed attempts for an IP within a time window
   */
  countFailedAttemptsByIp(
    ipAddress: string,
    windowMinutes: number
  ): Promise<number>;

  /**
   * Get recent login attempts for an email
   */
  getRecentAttempts(email: string, limit?: number): Promise<LoginAttempt[]>;

  /**
   * Get login attempt statistics for an email
   */
  getStats(email: string, windowMinutes: number): Promise<LoginAttemptStats>;

  /**
   * Delete old login attempts (cleanup)
   */
  deleteOlderThan(days: number): Promise<number>;
}
