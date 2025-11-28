/**
 * Logout User Use Case
 *
 * Handles user logout by invalidating the session.
 */

import type { ITokenGenerator } from '../../ports/services/token-generator.interface.js';
import type { ISessionRepository } from '../../ports/repositories/session.repository.interface.js';
import { type Result, success } from '../common/result.js';

export interface LogoutUserInput {
  refreshToken: string;
}

export interface LogoutUserOutput {
  message: string;
}

export interface LogoutUserDependencies {
  sessionRepository: ISessionRepository;
  tokenGenerator: ITokenGenerator;
}

export class LogoutUserUseCase {
  constructor(private readonly deps: LogoutUserDependencies) {}

  async execute(input: LogoutUserInput): Promise<Result<LogoutUserOutput>> {
    // 1. Hash the refresh token
    const tokenHash = this.deps.tokenGenerator.hashToken(input.refreshToken);

    // 2. Find and delete the session
    const session = await this.deps.sessionRepository.findByTokenHash(
      tokenHash
    );

    if (session) {
      await this.deps.sessionRepository.delete(session.id);
    }

    // Always return success (even if session not found)
    return success({
      message: 'Logged out successfully',
    });
  }
}

/**
 * Logout All Use Case
 *
 * Logs out from all devices by invalidating all sessions.
 */
export interface LogoutAllInput {
  userId: string;
}

export interface LogoutAllOutput {
  message: string;
  sessionsRevoked: number;
}

export class LogoutAllUseCase {
  constructor(private readonly deps: LogoutUserDependencies) {}

  async execute(input: LogoutAllInput): Promise<Result<LogoutAllOutput>> {
    // 1. Get session count before deletion
    const sessionCount = await this.deps.sessionRepository.countByUserId(
      input.userId
    );

    // 2. Delete all sessions for the user
    await this.deps.sessionRepository.deleteAllForUser(input.userId);

    return success({
      message: 'Logged out from all devices',
      sessionsRevoked: sessionCount,
    });
  }
}
