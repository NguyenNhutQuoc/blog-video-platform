/**
 * Refresh Token Use Case
 *
 * Handles token refresh with rotation.
 */

import type { IUserRepository } from '../../ports/repositories/user.repository.interface.js';
import type {
  ITokenGenerator,
  TokenPair,
} from '../../ports/services/token-generator.interface.js';
import type { ISessionRepository } from '../../ports/repositories/session.repository.interface.js';
import { type Result, success, failure, ErrorCodes } from '../common/result.js';

export interface RefreshTokenInput {
  refreshToken: string;
  userAgent?: string;
  ipAddress?: string;
}

export interface RefreshTokenOutput {
  tokens: TokenPair;
}

export interface RefreshTokenDependencies {
  userRepository: IUserRepository;
  sessionRepository: ISessionRepository;
  tokenGenerator: ITokenGenerator;
}

export class RefreshTokenUseCase {
  constructor(private readonly deps: RefreshTokenDependencies) {}

  async execute(input: RefreshTokenInput): Promise<Result<RefreshTokenOutput>> {
    // 1. Verify the refresh token JWT
    const decoded = await this.deps.tokenGenerator.verifyRefreshToken(
      input.refreshToken
    );

    if (!decoded) {
      return failure(
        ErrorCodes.INVALID_TOKEN,
        'Invalid or expired refresh token'
      );
    }

    // 2. Hash the token and find the session
    const tokenHash = this.deps.tokenGenerator.hashToken(input.refreshToken);
    const session = await this.deps.sessionRepository.findByTokenHash(
      tokenHash
    );

    if (!session) {
      return failure(ErrorCodes.SESSION_NOT_FOUND, 'Session not found');
    }

    // 3. Check if session is expired
    if (session.isExpired()) {
      await this.deps.sessionRepository.delete(session.id);
      return failure(ErrorCodes.SESSION_EXPIRED, 'Session has expired');
    }

    // 4. Get user
    const user = await this.deps.userRepository.findById(decoded.userId);

    if (!user) {
      await this.deps.sessionRepository.delete(session.id);
      return failure(ErrorCodes.USER_NOT_FOUND, 'User not found');
    }

    if (!user.isActive) {
      await this.deps.sessionRepository.delete(session.id);
      return failure(ErrorCodes.USER_INACTIVE, 'Account is deactivated');
    }

    // 5. Generate new token pair
    const newTokens = await this.deps.tokenGenerator.generateTokenPair({
      userId: user.id,
      email: user.email,
      username: user.username,
      isAdmin: user.isAdmin,
    });

    // 6. Rotate refresh token (update session with new hash)
    const newTokenHash = this.deps.tokenGenerator.hashToken(
      newTokens.refreshToken
    );
    session.rotateToken(newTokenHash);
    session.extend(30); // Extend session for 30 more days

    await this.deps.sessionRepository.save(session);

    // 7. Return new tokens
    return success({
      tokens: newTokens,
    });
  }
}
