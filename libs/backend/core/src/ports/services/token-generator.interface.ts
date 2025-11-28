/**
 * Token Generator Interface (Port)
 *
 * Defines the contract for JWT token generation and validation.
 */

export interface TokenPayload {
  userId: string;
  email: string;
  username: string;
  isAdmin: boolean;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: Date;
  refreshTokenExpiresAt: Date;
}

export interface ITokenGenerator {
  /**
   * Generate access and refresh tokens
   */
  generateTokenPair(payload: TokenPayload): Promise<TokenPair>;

  /**
   * Verify and decode an access token
   */
  verifyAccessToken(token: string): Promise<TokenPayload | null>;

  /**
   * Verify and decode a refresh token
   */
  verifyRefreshToken(token: string): Promise<TokenPayload | null>;

  /**
   * Generate a random token string (for refresh tokens storage)
   */
  generateRandomToken(): string;

  /**
   * Hash a token for secure storage
   */
  hashToken(token: string): string;
}
