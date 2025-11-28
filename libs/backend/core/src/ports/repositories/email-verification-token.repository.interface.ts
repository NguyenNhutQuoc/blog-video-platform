/**
 * Email Verification Token Repository Interface
 *
 * Port interface for managing email verification tokens.
 */

export interface EmailVerificationToken {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  usedAt: Date | null;
  createdAt: Date;
}

export interface CreateEmailVerificationTokenInput {
  userId: string;
  token: string;
  expiresAt: Date;
}

export interface IEmailVerificationTokenRepository {
  /**
   * Create a new email verification token
   */
  create(
    input: CreateEmailVerificationTokenInput
  ): Promise<EmailVerificationToken>;

  /**
   * Find token by token string
   */
  findByToken(token: string): Promise<EmailVerificationToken | null>;

  /**
   * Find valid (not expired, not used) token by user ID
   */
  findValidByUserId(userId: string): Promise<EmailVerificationToken | null>;

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
