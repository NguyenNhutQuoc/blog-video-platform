/**
 * Login User Use Case
 *
 * Handles user authentication with email/password.
 */

import type { IUserRepository } from '../../ports/repositories/user.repository.interface.js';
import type { IPasswordHasher } from '../../ports/services/password-hasher.interface.js';
import type {
  ITokenGenerator,
  TokenPair,
} from '../../ports/services/token-generator.interface.js';
import type { ISessionRepository } from '../../ports/repositories/session.repository.interface.js';
import { SessionEntity } from '@blog/shared/domain';
import { type Result, success, failure, ErrorCodes } from '../common/result.js';

export interface LoginUserInput {
  email: string;
  password: string;
  userAgent?: string;
  ipAddress?: string;
}

export interface LoginUserOutput {
  user: {
    id: string;
    email: string;
    username: string;
    fullName: string | null;
    isAdmin: boolean;
  };
  tokens: TokenPair;
}

export interface LoginUserDependencies {
  userRepository: IUserRepository;
  sessionRepository: ISessionRepository;
  passwordHasher: IPasswordHasher;
  tokenGenerator: ITokenGenerator;
}

export class LoginUserUseCase {
  constructor(private readonly deps: LoginUserDependencies) {}

  async execute(input: LoginUserInput): Promise<Result<LoginUserOutput>> {
    // 1. Find user by email
    const user = await this.deps.userRepository.findByEmail(
      input.email.toLowerCase()
    );

    if (!user) {
      return failure(
        ErrorCodes.INVALID_CREDENTIALS,
        'Invalid email or password'
      );
    }

    // 2. Check if user is active
    if (!user.isActive) {
      return failure(ErrorCodes.USER_INACTIVE, 'Account is deactivated');
    }

    // 3. Verify password
    const userData = user.toJSON();
    const isPasswordValid = await this.deps.passwordHasher.compare(
      input.password,
      userData.passwordHash
    );

    if (!isPasswordValid) {
      return failure(
        ErrorCodes.INVALID_CREDENTIALS,
        'Invalid email or password'
      );
    }

    // 4. Generate tokens
    const tokens = await this.deps.tokenGenerator.generateTokenPair({
      userId: user.id,
      email: user.email,
      username: user.username,
      isAdmin: user.isAdmin,
    });

    // 5. Create session
    const refreshTokenHash = this.deps.tokenGenerator.hashToken(
      tokens.refreshToken
    );
    const session = SessionEntity.create({
      userId: user.id,
      refreshToken: refreshTokenHash,
      userAgent: input.userAgent,
      ipAddress: input.ipAddress,
      expiresInDays: 30,
    });

    await this.deps.sessionRepository.save(session);

    // 6. Return result
    return success({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        fullName: userData.fullName,
        isAdmin: user.isAdmin,
      },
      tokens,
    });
  }
}
