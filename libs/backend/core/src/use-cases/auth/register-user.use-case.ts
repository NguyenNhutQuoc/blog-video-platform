/**
 * Register User Use Case
 *
 * Handles user registration with email/password.
 */

import crypto from 'crypto';
import { UserEntity, CreateUserDtoSchema } from '@blog/shared/domain';
import type { IUserRepository } from '../../ports/repositories/user.repository.interface.js';
import type { IPasswordHasher } from '../../ports/services/password-hasher.interface.js';
import type {
  ITokenGenerator,
  TokenPair,
} from '../../ports/services/token-generator.interface.js';
import type { ISessionRepository } from '../../ports/repositories/session.repository.interface.js';
import type { IEmailVerificationTokenRepository } from '../../ports/repositories/email-verification-token.repository.interface.js';
import type { IEmailService } from '../../ports/services/email.service.interface.js';
import { SessionEntity } from '@blog/shared/domain';
import { type Result, success, failure, ErrorCodes } from '../common/result.js';

export interface RegisterUserInput {
  email: string;
  username: string;
  password: string;
  fullName?: string;
  userAgent?: string;
  ipAddress?: string;
  appUrl?: string;
}

export interface RegisterUserOutput {
  user: {
    id: string;
    email: string;
    username: string;
    fullName: string | null;
    emailVerified: boolean;
  };
  tokens: TokenPair;
  message?: string;
}

export interface RegisterUserDependencies {
  userRepository: IUserRepository;
  sessionRepository: ISessionRepository;
  passwordHasher: IPasswordHasher;
  tokenGenerator: ITokenGenerator;
  emailVerificationTokenRepository?: IEmailVerificationTokenRepository;
  emailService?: IEmailService;
}

/** Token expiration: 24 hours */
const VERIFICATION_TOKEN_EXPIRES_IN_HOURS = 24;

export class RegisterUserUseCase {
  constructor(private readonly deps: RegisterUserDependencies) {}

  async execute(input: RegisterUserInput): Promise<Result<RegisterUserOutput>> {
    // 1. Validate input
    const validation = CreateUserDtoSchema.safeParse({
      email: input.email,
      username: input.username,
      password: input.password,
      fullName: input.fullName,
    });

    if (!validation.success) {
      return failure(ErrorCodes.VALIDATION_ERROR, 'Invalid input', {
        errors: validation.error.flatten().fieldErrors,
      });
    }

    // 2. Check if email already exists
    const emailExists = await this.deps.userRepository.emailExists(input.email);
    if (emailExists) {
      return failure(
        ErrorCodes.EMAIL_ALREADY_EXISTS,
        'Email is already registered'
      );
    }

    // 3. Check if username already exists
    const usernameExists = await this.deps.userRepository.usernameExists(
      input.username
    );
    if (usernameExists) {
      return failure(
        ErrorCodes.USERNAME_ALREADY_EXISTS,
        'Username is already taken'
      );
    }

    // 4. Hash password
    const passwordHash = await this.deps.passwordHasher.hash(input.password);

    // 5. Create user entity
    const user = UserEntity.create({
      email: input.email.toLowerCase(),
      username: input.username.toLowerCase(),
      passwordHash,
      fullName: input.fullName ?? null,
      bio: null,
      avatarUrl: null,
      socialLinks: {},
      emailVerified: false,
      isActive: true,
      isAdmin: false,
      spamScore: 0,
      failedLoginAttempts: 0,
      lockedUntil: null,
      lastLoginAt: null,
      passwordChangedAt: null,
      deletedAt: null,
    });

    // 6. Save user
    await this.deps.userRepository.save(user);

    // 7. Generate tokens
    const tokens = await this.deps.tokenGenerator.generateTokenPair({
      userId: user.id,
      email: user.email,
      username: user.username,
      isAdmin: user.isAdmin,
    });

    // 8. Create session
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

    // 9. Send verification email (if email service is configured)
    let verificationMessage: string | undefined;
    if (
      this.deps.emailService?.isConfigured() &&
      this.deps.emailVerificationTokenRepository &&
      input.appUrl
    ) {
      try {
        // Generate verification token
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(
          Date.now() + VERIFICATION_TOKEN_EXPIRES_IN_HOURS * 60 * 60 * 1000
        );

        await this.deps.emailVerificationTokenRepository.create({
          userId: user.id,
          token: verificationToken,
          expiresAt,
        });

        // Send verification email
        const verificationUrl = `${input.appUrl}/verify-email?token=${verificationToken}`;
        const emailResult = await this.deps.emailService.sendVerificationEmail({
          to: user.email,
          username: user.username,
          verificationUrl,
          expiresInHours: VERIFICATION_TOKEN_EXPIRES_IN_HOURS,
        });

        if (emailResult.success) {
          verificationMessage =
            'Registration successful! Please check your email to verify your account.';
        }
      } catch (error) {
        // Log error but don't fail registration
        console.error('Failed to send verification email:', error);
      }
    }

    // 10. Return result
    return success({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        fullName: user.toJSON().fullName,
        emailVerified: false,
      },
      tokens,
      message: verificationMessage,
    });
  }
}
