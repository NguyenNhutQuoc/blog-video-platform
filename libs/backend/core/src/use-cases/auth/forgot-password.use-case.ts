/**
 * Forgot Password Use Case
 *
 * Handles password reset request - sends reset email with token.
 */

import crypto from 'crypto';
import type { IUserRepository } from '../../ports/repositories/user.repository.interface.js';
import type { IPasswordResetTokenRepository } from '../../ports/repositories/password-reset-token.repository.interface.js';
import type { IEmailService } from '../../ports/services/email.service.interface.js';
import { type Result, success, failure, ErrorCodes } from '../common/result.js';

export interface ForgotPasswordInput {
  email: string;
  appUrl: string;
}

export interface ForgotPasswordOutput {
  message: string;
}

export interface ForgotPasswordDependencies {
  userRepository: IUserRepository;
  passwordResetTokenRepository: IPasswordResetTokenRepository;
  emailService: IEmailService;
}

/** Token expiration: 1 hour */
const TOKEN_EXPIRES_IN_MINUTES = 60;

export class ForgotPasswordUseCase {
  constructor(private readonly deps: ForgotPasswordDependencies) {}

  async execute(
    input: ForgotPasswordInput
  ): Promise<Result<ForgotPasswordOutput>> {
    // 1. Find user by email
    const user = await this.deps.userRepository.findByEmail(
      input.email.toLowerCase()
    );

    // Always return success to prevent email enumeration
    if (!user) {
      return success({
        message:
          'If an account exists with this email, a password reset link will be sent.',
      });
    }

    // 2. Check if user is active
    if (!user.isActive) {
      return success({
        message:
          'If an account exists with this email, a password reset link will be sent.',
      });
    }

    // 3. Check for existing valid token (rate limiting at use-case level)
    const existingToken =
      await this.deps.passwordResetTokenRepository.findValidByUserId(user.id);

    if (existingToken) {
      // If token was created less than 2 minutes ago, don't send a new one
      const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
      if (existingToken.createdAt > twoMinutesAgo) {
        return success({
          message:
            'A password reset email was recently sent. Please check your inbox or try again in a few minutes.',
        });
      }
    }

    // 4. Generate new token (this also deletes old tokens)
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(
      Date.now() + TOKEN_EXPIRES_IN_MINUTES * 60 * 1000
    );

    await this.deps.passwordResetTokenRepository.create({
      userId: user.id,
      token,
      expiresAt,
    });

    // 5. Send password reset email
    const resetUrl = `${input.appUrl}/reset-password?token=${token}`;

    const emailResult = await this.deps.emailService.sendPasswordResetEmail({
      to: user.email,
      username: user.username,
      resetUrl,
      expiresInMinutes: TOKEN_EXPIRES_IN_MINUTES,
    });

    if (!emailResult.success) {
      console.error('Failed to send password reset email:', emailResult.error);
      return failure(
        ErrorCodes.EMAIL_SEND_FAILED,
        'Failed to send password reset email. Please try again later.'
      );
    }

    return success({
      message:
        'If an account exists with this email, a password reset link will be sent.',
    });
  }
}
