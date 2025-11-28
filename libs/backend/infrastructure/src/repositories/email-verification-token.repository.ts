/**
 * Email Verification Token Repository Implementation
 *
 * PostgreSQL implementation for managing email verification tokens.
 */

import type { Pool } from 'pg';
import type {
  IEmailVerificationTokenRepository,
  EmailVerificationToken,
  CreateEmailVerificationTokenInput,
} from '@blog/backend/core';

export class EmailVerificationTokenRepository
  implements IEmailVerificationTokenRepository
{
  constructor(private readonly pool: Pool) {}

  async create(
    input: CreateEmailVerificationTokenInput
  ): Promise<EmailVerificationToken> {
    const query = `
      INSERT INTO email_verification_tokens (user_id, token, expires_at)
      VALUES ($1, $2, $3)
      RETURNING id, user_id, token, expires_at, used_at, created_at
    `;

    const result = await this.pool.query(query, [
      input.userId,
      input.token,
      input.expiresAt,
    ]);

    return this.mapRow(result.rows[0]);
  }

  async findByToken(token: string): Promise<EmailVerificationToken | null> {
    const query = `
      SELECT id, user_id, token, expires_at, used_at, created_at
      FROM email_verification_tokens
      WHERE token = $1
    `;

    const result = await this.pool.query(query, [token]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRow(result.rows[0]);
  }

  async findValidByUserId(
    userId: string
  ): Promise<EmailVerificationToken | null> {
    const query = `
      SELECT id, user_id, token, expires_at, used_at, created_at
      FROM email_verification_tokens
      WHERE user_id = $1
        AND used_at IS NULL
        AND expires_at > CURRENT_TIMESTAMP
      ORDER BY created_at DESC
      LIMIT 1
    `;

    const result = await this.pool.query(query, [userId]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRow(result.rows[0]);
  }

  async markAsUsed(tokenId: string): Promise<void> {
    const query = `
      UPDATE email_verification_tokens
      SET used_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `;

    await this.pool.query(query, [tokenId]);
  }

  async deleteByUserId(userId: string): Promise<void> {
    const query = `
      DELETE FROM email_verification_tokens
      WHERE user_id = $1
    `;

    await this.pool.query(query, [userId]);
  }

  async deleteExpired(): Promise<number> {
    const query = `
      DELETE FROM email_verification_tokens
      WHERE expires_at < CURRENT_TIMESTAMP - INTERVAL '7 days'
    `;

    const result = await this.pool.query(query);
    return result.rowCount ?? 0;
  }

  private mapRow(row: {
    id: string;
    user_id: string;
    token: string;
    expires_at: Date;
    used_at: Date | null;
    created_at: Date;
  }): EmailVerificationToken {
    return {
      id: row.id,
      userId: row.user_id,
      token: row.token,
      expiresAt: row.expires_at,
      usedAt: row.used_at,
      createdAt: row.created_at,
    };
  }
}
