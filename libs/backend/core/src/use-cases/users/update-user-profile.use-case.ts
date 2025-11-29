/**
 * Update User Profile Use Case
 *
 * Handles user profile updates with validation.
 */

import { z } from 'zod';
import type { IUserRepository } from '../../ports/repositories/user.repository.interface.js';
import { type Result, success, failure, ErrorCodes } from '../common/result.js';

/** Maximum bio length (BR-02) */
const MAX_BIO_LENGTH = 500;

/** Update Profile DTO Schema */
const UpdateProfileDtoSchema = z.object({
  fullName: z.string().min(1).max(100).optional(),
  bio: z
    .string()
    .max(MAX_BIO_LENGTH, `Bio must be at most ${MAX_BIO_LENGTH} characters`)
    .nullable()
    .optional(),
  avatarUrl: z.string().url().max(500).nullable().optional(),
  socialLinks: z.record(z.string(), z.string().url().max(200)).optional(),
});

export interface UpdateUserProfileInput {
  /** User ID performing the update (must be profile owner) */
  userId: string;
  /** Profile updates */
  updates: {
    fullName?: string;
    bio?: string | null;
    avatarUrl?: string | null;
    socialLinks?: Record<string, string>;
  };
}

export interface UpdateUserProfileOutput {
  user: {
    id: string;
    username: string;
    fullName: string | null;
    bio: string | null;
    avatarUrl: string | null;
    socialLinks: Record<string, string>;
    updatedAt: Date;
  };
}

export interface UpdateUserProfileDependencies {
  userRepository: IUserRepository;
}

export class UpdateUserProfileUseCase {
  constructor(private readonly deps: UpdateUserProfileDependencies) {}

  async execute(
    input: UpdateUserProfileInput
  ): Promise<Result<UpdateUserProfileOutput>> {
    // 1. Validate input
    const validation = UpdateProfileDtoSchema.safeParse(input.updates);
    if (!validation.success) {
      return failure(ErrorCodes.VALIDATION_ERROR, 'Invalid input', {
        errors: validation.error.flatten().fieldErrors,
      });
    }

    // 2. Find user
    const user = await this.deps.userRepository.findById(input.userId);
    if (!user) {
      return failure(ErrorCodes.USER_NOT_FOUND, 'User not found');
    }

    const userData = user.toJSON();

    // 3. Check if user is active
    if (!userData.isActive) {
      return failure(ErrorCodes.USER_INACTIVE, 'User account is inactive');
    }

    // 4. Update profile
    user.updateProfile({
      fullName: input.updates.fullName,
      bio: input.updates.bio,
      avatarUrl: input.updates.avatarUrl,
      socialLinks: input.updates.socialLinks,
    });

    // 5. Save user
    await this.deps.userRepository.save(user);

    // 6. Return result
    const updatedUserData = user.toJSON();

    // Filter out undefined values from socialLinks
    const socialLinks: Record<string, string> = {};
    if (updatedUserData.socialLinks) {
      for (const [key, value] of Object.entries(updatedUserData.socialLinks)) {
        if (value !== undefined) {
          socialLinks[key] = value;
        }
      }
    }

    return success({
      user: {
        id: updatedUserData.id,
        username: updatedUserData.username,
        fullName: updatedUserData.fullName,
        bio: updatedUserData.bio,
        avatarUrl: updatedUserData.avatarUrl,
        socialLinks,
        updatedAt: updatedUserData.updatedAt,
      },
    });
  }
}
