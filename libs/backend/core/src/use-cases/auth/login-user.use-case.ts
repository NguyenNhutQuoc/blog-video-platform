/**
 * Login User Use Case
 *
 * Handles user authentication with email/password.
 * Includes account lockout protection against brute force attacks.
 */

import type { IUserRepository } from '../../ports/repositories/user.repository.interface.js';
import type { IPasswordHasher } from '../../ports/services/password-hasher.interface.js';
import type {
  ITokenGenerator,
  TokenPair,
} from '../../ports/services/token-generator.interface.js';
import type { ISessionRepository } from '../../ports/repositories/session.repository.interface.js';
import type { ILoginAttemptRepository } from '../../ports/repositories/login-attempt.repository.interface.js';
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
  /** Optional: for tracking login attempts (account lockout) */
  loginAttemptRepository?: ILoginAttemptRepository;
  /** Max failed attempts before lockout (default: 5) */
  maxFailedAttempts?: number;
  /** Lockout duration in minutes (default: 15) */
  lockoutDurationMinutes?: number;
}

export class LoginUserUseCase {
  private readonly maxFailedAttempts: number;
  private readonly lockoutDurationMinutes: number;

  constructor(private readonly deps: LoginUserDependencies) {
    this.maxFailedAttempts = deps.maxFailedAttempts ?? 5;
    this.lockoutDurationMinutes = deps.lockoutDurationMinutes ?? 15;
  }

  async execute(input: LoginUserInput): Promise<Result<LoginUserOutput>> {
    // 1. Find user by email
    const user = await this.deps.userRepository.findByEmail(
      input.email.toLowerCase()
    );

    if (!user) {
      // Record failed attempt for IP-based tracking (optional)
      await this.recordFailedAttempt(null, input.ipAddress);
      return failure(
        ErrorCodes.INVALID_CREDENTIALS,
        'Invalid email or password'
      );
    }

    console.log('Found user:', user);

    // 2. Check if account is locked
    if (user.isLocked()) {
      const remainingMinutes = user.getRemainingLockoutMinutes();
      return failure(
        ErrorCodes.ACCOUNT_LOCKED,
        `Account is temporarily locked. Please try again in ${remainingMinutes} minute${
          remainingMinutes > 1 ? 's' : ''
        }.`
      );
    }

    // 3. Check if user is active
    if (!user.isActive) {
      return failure(ErrorCodes.USER_INACTIVE, 'Account is deactivated');
    }

    // 4. Verify password
    const userData = user.toJSON();
    const isPasswordValid = await this.deps.passwordHasher.compare(
      input.password,
      userData.passwordHash
    );

    if (!isPasswordValid) {
      // Record failed login attempt and check if should lock
      await this.handleFailedLogin(user.id, input.ipAddress);
      return failure(
        ErrorCodes.INVALID_CREDENTIALS,
        'Invalid email or password'
      );
    }

    // 5. Successful login - reset failed attempts
    await this.deps.userRepository.recordSuccessfulLogin(user.id);

    // Record successful attempt for audit
    await this.recordSuccessfulAttempt(user.id, input.ipAddress);

    // 6. Generate tokens
    const tokens = await this.deps.tokenGenerator.generateTokenPair({
      userId: user.id,
      email: user.email,
      username: user.username,
      isAdmin: user.isAdmin,
    });

    // 7. Create session
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

    // 8. Return result
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

  /**
   * Handle failed login - increment counter and lock if threshold reached
   */
  private async handleFailedLogin(
    userId: string,
    ipAddress?: string
  ): Promise<void> {
    // Increment failed attempts in database
    const failedAttempts =
      await this.deps.userRepository.incrementFailedAttempts(userId);

    // Record attempt for audit
    await this.recordFailedAttempt(userId, ipAddress);

    // Check if should lock account
    if (failedAttempts >= this.maxFailedAttempts) {
      const lockUntil = new Date(
        Date.now() + this.lockoutDurationMinutes * 60 * 1000
      );
      await this.deps.userRepository.lockAccount(userId, lockUntil);
    }
  }

  /**
   * Record failed attempt in login_attempts table (if available)
   */
  private async recordFailedAttempt(
    userId: string | null,
    ipAddress?: string
  ): Promise<void> {
    if (this.deps.loginAttemptRepository) {
      // Get the email from the user if available
      const user = userId
        ? await this.deps.userRepository.findById(userId)
        : null;
      await this.deps.loginAttemptRepository.create({
        email: user?.email ?? 'unknown',
        ipAddress,
        success: false,
        failureReason: 'Invalid credentials',
      });
    }
  }

  /**
   * Record successful attempt in login_attempts table (if available)
   */
  private async recordSuccessfulAttempt(
    userId: string,
    ipAddress?: string
  ): Promise<void> {
    if (this.deps.loginAttemptRepository) {
      const user = await this.deps.userRepository.findById(userId);
      if (user) {
        await this.deps.loginAttemptRepository.create({
          email: user.email,
          ipAddress,
          success: true,
        });
      }
    }
  }
}
