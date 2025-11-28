/**
 * Password Reset Token Repository Implementation
 *
 * PostgreSQL implementation for managing password reset tokens.
 */

import type { Pool } from 'pg';
import type {
  IPasswordResetTokenRepository,
  PasswordResetToken,
  CreatePasswordResetTokenInput,
} from '@blog/backend/core';

export class PasswordResetTokenRepository
  implements IPasswordResetTokenRepository
{
  constructor(private readonly pool: Pool) {}

  async create(
    input: CreatePasswordResetTokenInput
  ): Promise<PasswordResetToken> {
    // Delete any existing tokens for this user first
    await this.deleteByUserId(input.userId);

    const query = `
      INSERT INTO password_reset_tokens (user_id, token, expires_at)
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

  async findByToken(token: string): Promise<PasswordResetToken | null> {
    const query = `
      SELECT id, user_id, token, expires_at, used_at, created_at
      FROM password_reset_tokens
      WHERE token = $1
    `;

    const result = await this.pool.query(query, [token]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRow(result.rows[0]);
  }

  async findValidByUserId(userId: string): Promise<PasswordResetToken | null> {
    const query = `
      SELECT id, user_id, token, expires_at, used_at, created_at
      FROM password_reset_tokens
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
      UPDATE password_reset_tokens
      SET used_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `;

    await this.pool.query(query, [tokenId]);
  }

  async deleteByUserId(userId: string): Promise<void> {
    const query = `
      DELETE FROM password_reset_tokens
      WHERE user_id = $1
    `;

    await this.pool.query(query, [userId]);
  }

  async deleteExpired(): Promise<number> {
    const query = `
      DELETE FROM password_reset_tokens
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
  }): PasswordResetToken {
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
