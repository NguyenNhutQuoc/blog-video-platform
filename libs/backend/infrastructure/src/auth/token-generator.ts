/**
 * JWT Token Generator
 *
 * Implementation of ITokenGenerator using jsonwebtoken.
 */

import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import type {
  ITokenGenerator,
  TokenPayload,
  TokenPair,
} from '@blog/backend/core';

export interface JwtConfig {
  accessTokenSecret: string;
  refreshTokenSecret: string;
  accessTokenExpiresInSeconds: number; // e.g., 900 for 15m
  refreshTokenExpiresInSeconds: number; // e.g., 604800 for 7d
}

export class JwtTokenGenerator implements ITokenGenerator {
  constructor(private readonly config: JwtConfig) {}

  async generateTokenPair(payload: TokenPayload): Promise<TokenPair> {
    const now = new Date();

    // Generate access token
    const accessToken = jwt.sign(payload, this.config.accessTokenSecret, {
      expiresIn: this.config.accessTokenExpiresInSeconds,
    });

    // Generate refresh token
    const refreshToken = jwt.sign(
      { userId: payload.userId },
      this.config.refreshTokenSecret,
      { expiresIn: this.config.refreshTokenExpiresInSeconds }
    );

    // Calculate expiration dates
    const accessTokenExpiresAt = new Date(
      now.getTime() + this.config.accessTokenExpiresInSeconds * 1000
    );
    const refreshTokenExpiresAt = new Date(
      now.getTime() + this.config.refreshTokenExpiresInSeconds * 1000
    );

    return {
      accessToken,
      refreshToken,
      accessTokenExpiresAt,
      refreshTokenExpiresAt,
    };
  }

  async verifyAccessToken(token: string): Promise<TokenPayload | null> {
    try {
      const decoded = jwt.verify(
        token,
        this.config.accessTokenSecret
      ) as TokenPayload;
      return decoded;
    } catch {
      return null;
    }
  }

  async verifyRefreshToken(token: string): Promise<TokenPayload | null> {
    try {
      const decoded = jwt.verify(token, this.config.refreshTokenSecret) as {
        userId: string;
      };
      // Return minimal payload for refresh token
      return {
        userId: decoded.userId,
        email: '',
        username: '',
        isAdmin: false,
      };
    } catch {
      return null;
    }
  }

  generateRandomToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}

/**
 * Parse time string to seconds
 * Supports: 15m, 1h, 7d, etc.
 */
function parseTimeToSeconds(timeStr: string): number {
  const match = timeStr.match(/^(\d+)([smhd])$/);
  if (!match) {
    // Try parsing as raw seconds
    const seconds = parseInt(timeStr, 10);
    if (!isNaN(seconds)) return seconds;
    throw new Error(`Invalid time format: ${timeStr}`);
  }

  const value = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case 's':
      return value;
    case 'm':
      return value * 60;
    case 'h':
      return value * 60 * 60;
    case 'd':
      return value * 60 * 60 * 24;
    default:
      throw new Error(`Unknown time unit: ${unit}`);
  }
}

/**
 * Create a JWT token generator from environment variables
 */
export function createTokenGenerator(
  config?: Partial<JwtConfig>
): ITokenGenerator {
  const accessExpiresIn = process.env['JWT_ACCESS_EXPIRES_IN'] ?? '15m';
  const refreshExpiresIn = process.env['JWT_REFRESH_EXPIRES_IN'] ?? '7d';

  const fullConfig: JwtConfig = {
    accessTokenSecret:
      config?.accessTokenSecret ??
      process.env['JWT_ACCESS_SECRET'] ??
      process.env['JWT_SECRET'] ??
      'default-access-secret-change-me',
    refreshTokenSecret:
      config?.refreshTokenSecret ??
      process.env['JWT_REFRESH_SECRET'] ??
      'default-refresh-secret-change-me',
    accessTokenExpiresInSeconds:
      config?.accessTokenExpiresInSeconds ??
      parseTimeToSeconds(accessExpiresIn),
    refreshTokenExpiresInSeconds:
      config?.refreshTokenExpiresInSeconds ??
      parseTimeToSeconds(refreshExpiresIn),
  };

  return new JwtTokenGenerator(fullConfig);
}
