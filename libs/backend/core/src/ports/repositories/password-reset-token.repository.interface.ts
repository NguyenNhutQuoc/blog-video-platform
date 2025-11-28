/**
 * Password Reset Token Repository Interface
 *
 * Port interface for managing password reset tokens.
 */

export interface PasswordResetToken {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  usedAt: Date | null;
  createdAt: Date;
}

export interface CreatePasswordResetTokenInput {
  userId: string;
  token: string;
  expiresAt: Date;
}

export interface IPasswordResetTokenRepository {
  /**
   * Create a new password reset token
   */
  create(input: CreatePasswordResetTokenInput): Promise<PasswordResetToken>;

  /**
   * Find token by token string
   */
  findByToken(token: string): Promise<PasswordResetToken | null>;

  /**
   * Find valid (not expired, not used) token by user ID
   */
  findValidByUserId(userId: string): Promise<PasswordResetToken | null>;

  /**
   * Mark token as used
   */
  markAsUsed(tokenId: string): Promise<void>;

  /**
   * Delete all tokens for a user
   */
  deleteByUserId(userId: string): Promise<void>;

  /**
   * Delete expired tokens (cleanup)
   */
  deleteExpired(): Promise<number>;
}
