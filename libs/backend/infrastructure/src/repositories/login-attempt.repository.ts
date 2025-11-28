/**
 * Login Attempt Repository Implementation
 *
 * PostgreSQL implementation for tracking login attempts.
 */

import type { Pool } from 'pg';
import type {
  ILoginAttemptRepository,
  LoginAttempt,
  CreateLoginAttemptInput,
  LoginAttemptStats,
} from '@blog/backend/core';

export class LoginAttemptRepository implements ILoginAttemptRepository {
  constructor(private readonly pool: Pool) {}

  async create(input: CreateLoginAttemptInput): Promise<LoginAttempt> {
    const query = `
      INSERT INTO login_attempts (email, ip_address, user_agent, success, failure_reason)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, email, ip_address, user_agent, success, failure_reason, created_at
    `;

    const result = await this.pool.query(query, [
      input.email.toLowerCase(),
      input.ipAddress ?? null,
      input.userAgent ?? null,
      input.success,
      input.failureReason ?? null,
    ]);

    return this.mapRow(result.rows[0]);
  }

  async countFailedAttempts(
    email: string,
    windowMinutes: number
  ): Promise<number> {
    const query = `
      SELECT COUNT(*) as count
      FROM login_attempts
      WHERE email = $1
        AND success = FALSE
        AND created_at > CURRENT_TIMESTAMP - ($2 || ' minutes')::INTERVAL
    `;

    const result = await this.pool.query(query, [
      email.toLowerCase(),
      windowMinutes.toString(),
    ]);

    return parseInt(result.rows[0].count, 10);
  }

  async countFailedAttemptsByIp(
    ipAddress: string,
    windowMinutes: number
  ): Promise<number> {
    const query = `
      SELECT COUNT(*) as count
      FROM login_attempts
      WHERE ip_address = $1
        AND success = FALSE
        AND created_at > CURRENT_TIMESTAMP - ($2 || ' minutes')::INTERVAL
    `;

    const result = await this.pool.query(query, [
      ipAddress,
      windowMinutes.toString(),
    ]);

    return parseInt(result.rows[0].count, 10);
  }

  async getRecentAttempts(email: string, limit = 10): Promise<LoginAttempt[]> {
    const query = `
      SELECT id, email, ip_address, user_agent, success, failure_reason, created_at
      FROM login_attempts
      WHERE email = $1
      ORDER BY created_at DESC
      LIMIT $2
    `;

    const result = await this.pool.query(query, [email.toLowerCase(), limit]);

    return result.rows.map((row) => this.mapRow(row));
  }

  async getStats(
    email: string,
    windowMinutes: number
  ): Promise<LoginAttemptStats> {
    const query = `
      SELECT 
        COUNT(*) as total_attempts,
        COUNT(*) FILTER (WHERE success = FALSE) as failed_attempts,
        MAX(created_at) as last_attempt_at
      FROM login_attempts
      WHERE email = $1
        AND created_at > CURRENT_TIMESTAMP - ($2 || ' minutes')::INTERVAL
    `;

    const result = await this.pool.query(query, [
      email.toLowerCase(),
      windowMinutes.toString(),
    ]);

    const row = result.rows[0];
    return {
      totalAttempts: parseInt(row.total_attempts, 10),
      failedAttempts: parseInt(row.failed_attempts, 10),
      lastAttemptAt: row.last_attempt_at,
    };
  }

  async deleteOlderThan(days: number): Promise<number> {
    const query = `
      DELETE FROM login_attempts
      WHERE created_at < CURRENT_TIMESTAMP - ($1 || ' days')::INTERVAL
    `;

    const result = await this.pool.query(query, [days.toString()]);
    return result.rowCount ?? 0;
  }

  private mapRow(row: {
    id: string;
    email: string;
    ip_address: string | null;
    user_agent: string | null;
    success: boolean;
    failure_reason: string | null;
    created_at: Date;
  }): LoginAttempt {
    return {
      id: row.id,
      email: row.email,
      ipAddress: row.ip_address,
      userAgent: row.user_agent,
      success: row.success,
      failureReason: row.failure_reason,
      createdAt: row.created_at,
    };
  }
}
