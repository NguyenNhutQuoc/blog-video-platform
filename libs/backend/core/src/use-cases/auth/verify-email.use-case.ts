/**
 * Verify Email Use Case
 *
 * Handles email verification when user clicks the verification link.
 */

import type { IUserRepository } from '../../ports/repositories/user.repository.interface.js';
import type { IEmailVerificationTokenRepository } from '../../ports/repositories/email-verification-token.repository.interface.js';
import type { IEmailService } from '../../ports/services/email.service.interface.js';
import { type Result, success, failure, ErrorCodes } from '../common/result.js';

export interface VerifyEmailInput {
  token: string;
}

export interface VerifyEmailOutput {
  message: string;
  email: string;
}

export interface VerifyEmailDependencies {
  userRepository: IUserRepository;
  emailVerificationTokenRepository: IEmailVerificationTokenRepository;
  emailService?: IEmailService;
}

export class VerifyEmailUseCase {
  constructor(private readonly deps: VerifyEmailDependencies) {}

  async execute(input: VerifyEmailInput): Promise<Result<VerifyEmailOutput>> {
    // 1. Find the token
    const tokenRecord =
      await this.deps.emailVerificationTokenRepository.findByToken(input.token);

    if (!tokenRecord) {
      return failure(
        ErrorCodes.INVALID_TOKEN,
        'Invalid or expired verification link'
      );
    }

    // 2. Check if token is already used
    if (tokenRecord.usedAt) {
      return failure(
        ErrorCodes.TOKEN_ALREADY_USED,
        'This verification link has already been used'
      );
    }

    // 3. Check if token is expired
    if (new Date() > tokenRecord.expiresAt) {
      return failure(
        ErrorCodes.TOKEN_EXPIRED,
        'This verification link has expired. Please request a new one.'
      );
    }

    // 4. Find the user
    const user = await this.deps.userRepository.findById(tokenRecord.userId);

    if (!user) {
      return failure(ErrorCodes.USER_NOT_FOUND, 'User not found');
    }

    // 5. Check if already verified
    if (user.toJSON().emailVerified) {
      // Mark token as used anyway
      await this.deps.emailVerificationTokenRepository.markAsUsed(
        tokenRecord.id
      );

      return success({
        message: 'Your email is already verified',
        email: user.email,
      });
    }

    // 6. Mark user as verified
    user.verifyEmail();
    await this.deps.userRepository.save(user);

    // 7. Mark token as used
    await this.deps.emailVerificationTokenRepository.markAsUsed(tokenRecord.id);

    // 8. Delete all other verification tokens for this user
    await this.deps.emailVerificationTokenRepository.deleteByUserId(user.id);

    // 9. Send welcome email (optional, non-blocking)
    if (this.deps.emailService?.isConfigured()) {
      this.deps.emailService
        .sendWelcomeEmail({
          to: user.email,
          username: user.username,
        })
        .catch((error) => {
          console.error('Failed to send welcome email:', error);
        });
    }

    return success({
      message: 'Email verified successfully',
      email: user.email,
    });
  }
}
