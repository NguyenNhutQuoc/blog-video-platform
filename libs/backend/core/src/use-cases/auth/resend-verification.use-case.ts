/**
 * Resend Verification Email Use Case
 *
 * Handles resending email verification when user requests it.
 */

import crypto from 'crypto';
import type { IUserRepository } from '../../ports/repositories/user.repository.interface.js';
import type { IEmailVerificationTokenRepository } from '../../ports/repositories/email-verification-token.repository.interface.js';
import type { IEmailService } from '../../ports/services/email.service.interface.js';
import { type Result, success, failure, ErrorCodes } from '../common/result.js';

export interface ResendVerificationInput {
  email: string;
  appUrl: string;
}

export interface ResendVerificationOutput {
  message: string;
}

export interface ResendVerificationDependencies {
  userRepository: IUserRepository;
  emailVerificationTokenRepository: IEmailVerificationTokenRepository;
  emailService: IEmailService;
}

/** Token expiration: 24 hours */
const TOKEN_EXPIRES_IN_HOURS = 24;

export class ResendVerificationUseCase {
  constructor(private readonly deps: ResendVerificationDependencies) {}

  async execute(
    input: ResendVerificationInput
  ): Promise<Result<ResendVerificationOutput>> {
    // 1. Find user by email
    const user = await this.deps.userRepository.findByEmail(
      input.email.toLowerCase()
    );

    // Always return success to prevent email enumeration
    if (!user) {
      return success({
        message:
          'If an account exists with this email, a verification link will be sent.',
      });
    }

    // 2. Check if already verified
    if (user.toJSON().emailVerified) {
      return success({
        message: 'Your email is already verified. You can log in now.',
      });
    }

    // 3. Check if user is active
    if (!user.isActive) {
      return success({
        message:
          'If an account exists with this email, a verification link will be sent.',
      });
    }

    // 4. Check for existing valid token (rate limiting at use-case level)
    const existingToken =
      await this.deps.emailVerificationTokenRepository.findValidByUserId(
        user.id
      );

    if (existingToken) {
      // If token was created less than 1 minute ago, don't send a new one
      const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
      if (existingToken.createdAt > oneMinuteAgo) {
        return success({
          message:
            'A verification email was recently sent. Please check your inbox or try again in a minute.',
        });
      }
    }

    // 5. Delete old tokens
    await this.deps.emailVerificationTokenRepository.deleteByUserId(user.id);

    // 6. Generate new token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(
      Date.now() + TOKEN_EXPIRES_IN_HOURS * 60 * 60 * 1000
    );

    await this.deps.emailVerificationTokenRepository.create({
      userId: user.id,
      token,
      expiresAt,
    });

    // 7. Send verification email
    const verificationUrl = `${input.appUrl}/verify-email?token=${token}`;

    const emailResult = await this.deps.emailService.sendVerificationEmail({
      to: user.email,
      username: user.username,
      verificationUrl,
      expiresInHours: TOKEN_EXPIRES_IN_HOURS,
    });

    if (!emailResult.success) {
      console.error('Failed to send verification email:', emailResult.error);
      return failure(
        ErrorCodes.EMAIL_SEND_FAILED,
        'Failed to send verification email. Please try again later.'
      );
    }

    return success({
      message:
        'If an account exists with this email, a verification link will be sent.',
    });
  }
}
