/**
 * Reset Password Use Case
 *
 * Handles password reset when user submits new password with valid token.
 */

import { PasswordSchema } from '@blog/shared/domain';
import type { IUserRepository } from '../../ports/repositories/user.repository.interface.js';
import type { IPasswordResetTokenRepository } from '../../ports/repositories/password-reset-token.repository.interface.js';
import type { ISessionRepository } from '../../ports/repositories/session.repository.interface.js';
import type { IPasswordHasher } from '../../ports/services/password-hasher.interface.js';
import { type Result, success, failure, ErrorCodes } from '../common/result.js';

export interface ResetPasswordInput {
  token: string;
  newPassword: string;
}

export interface ResetPasswordOutput {
  message: string;
}

export interface ResetPasswordDependencies {
  userRepository: IUserRepository;
  passwordResetTokenRepository: IPasswordResetTokenRepository;
  sessionRepository: ISessionRepository;
  passwordHasher: IPasswordHasher;
}

export class ResetPasswordUseCase {
  constructor(private readonly deps: ResetPasswordDependencies) {}

  async execute(
    input: ResetPasswordInput
  ): Promise<Result<ResetPasswordOutput>> {
    // 1. Validate new password
    const passwordValidation = PasswordSchema.safeParse(input.newPassword);

    if (!passwordValidation.success) {
      return failure(ErrorCodes.VALIDATION_ERROR, 'Invalid password', {
        errors: passwordValidation.error.flatten().formErrors,
      });
    }

    // 2. Find the token
    const tokenRecord =
      await this.deps.passwordResetTokenRepository.findByToken(input.token);

    if (!tokenRecord) {
      return failure(
        ErrorCodes.INVALID_TOKEN,
        'Invalid or expired password reset link'
      );
    }

    // 3. Check if token is already used
    if (tokenRecord.usedAt) {
      return failure(
        ErrorCodes.TOKEN_ALREADY_USED,
        'This password reset link has already been used'
      );
    }

    // 4. Check if token is expired
    if (new Date() > tokenRecord.expiresAt) {
      return failure(
        ErrorCodes.TOKEN_EXPIRED,
        'This password reset link has expired. Please request a new one.'
      );
    }

    // 5. Find the user
    const user = await this.deps.userRepository.findById(tokenRecord.userId);

    if (!user) {
      return failure(ErrorCodes.USER_NOT_FOUND, 'User not found');
    }

    // 6. Hash new password
    const passwordHash = await this.deps.passwordHasher.hash(input.newPassword);

    // 7. Update user password
    user.changePassword(passwordHash);
    await this.deps.userRepository.save(user);

    // 8. Mark token as used
    await this.deps.passwordResetTokenRepository.markAsUsed(tokenRecord.id);

    // 9. Delete all other reset tokens for this user
    await this.deps.passwordResetTokenRepository.deleteByUserId(user.id);

    // 10. Invalidate all existing sessions (security measure)
    await this.deps.sessionRepository.deleteAllForUser(user.id);

    return success({
      message:
        'Password reset successfully. Please log in with your new password.',
    });
  }
}
