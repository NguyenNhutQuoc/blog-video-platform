import { z } from 'zod';

/**
 * User Entity - Domain Model
 * Represents a user account in the system
 */

// =====================================================
// ZOD SCHEMAS - Validation & Type Safety
// =====================================================

/**
 * Username validation:
 * - Only lowercase letters, numbers, underscore, hyphen
 * - 3-50 characters
 */
const UsernameSchema = z
  .string()
  .min(3, 'Username must be at least 3 characters')
  .max(50, 'Username must be at most 50 characters')
  .regex(
    /^[a-z0-9_-]+$/,
    'Username can only contain lowercase letters, numbers, _ and -'
  );

/**
 * Email validation: Standard email format
 */
const EmailSchema = z
  .string()
  .email('Invalid email format')
  .max(255, 'Email must be at most 255 characters');

/**
 * Password validation:
 * - Min 8 characters
 * - At least 1 uppercase, 1 lowercase, 1 number, 1 special char
 */
const PasswordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    'Password must contain uppercase, lowercase, number, and special character'
  );

/**
 * Social Links: JSON object with optional URLs
 */
const SocialLinksSchema = z.record(z.string(), z.url().optional()).default({});

/**
 * Spam Score: 0-100 range
 */
const SpamScoreSchema = z.number().int().min(0).max(100).default(0);

// =====================================================
// ENTITY SCHEMA
// =====================================================

/**
 * User Entity Schema (Database model)
 */
export const UserSchema = z.object({
  id: z.string().uuid(),
  email: EmailSchema,
  username: UsernameSchema,
  passwordHash: z.string().min(60).max(255), // Bcrypt hash
  fullName: z.string().max(100).nullable().default(null),
  bio: z.string().max(500).nullable().default(null),
  avatarUrl: z.string().url().max(500).nullable().default(null),
  socialLinks: SocialLinksSchema,
  emailVerified: z.boolean().default(false),
  isActive: z.boolean().default(true),
  isAdmin: z.boolean().default(false),
  spamScore: SpamScoreSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().nullable().default(null),
});

// =====================================================
// DTOs - Data Transfer Objects
// =====================================================

/**
 * Create User DTO (for registration)
 */
export const CreateUserDtoSchema = z.object({
  email: EmailSchema,
  username: UsernameSchema,
  password: PasswordSchema,
  fullName: z.string().max(100).optional(),
});

/**
 * Update User Profile DTO
 */
export const UpdateUserProfileDtoSchema = z.object({
  fullName: z.string().max(100).optional(),
  bio: z.string().max(500).optional(),
  avatarUrl: z.string().url().max(500).optional(),
  socialLinks: SocialLinksSchema.optional(),
});

/**
 * Change Password DTO
 */
export const ChangePasswordDtoSchema = z
  .object({
    currentPassword: z.string(),
    newPassword: PasswordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

/**
 * User Response DTO (without sensitive data)
 */
export const UserResponseDtoSchema = UserSchema.omit({
  passwordHash: true,
  deletedAt: true,
});

// =====================================================
// TYPE INFERENCE
// =====================================================

export type User = z.infer<typeof UserSchema>;
export type UserCreate = Omit<User, 'id' | 'createdAt' | 'updatedAt'>;
export type UserUpdate = Partial<
  Pick<User, 'fullName' | 'bio' | 'avatarUrl' | 'socialLinks'>
>;
export type CreateUserDto = z.infer<typeof CreateUserDtoSchema>;
export type UpdateUserProfileDto = z.infer<typeof UpdateUserProfileDtoSchema>;
export type ChangePasswordDto = z.infer<typeof ChangePasswordDtoSchema>;
export type UserResponseDto = z.infer<typeof UserResponseDtoSchema>;

// =====================================================
// DOMAIN LOGIC (Business Rules)
// =====================================================

export class UserEntity {
  constructor(private readonly props: User) {}

  // Getters
  get id(): string {
    return this.props.id;
  }

  get email(): string {
    return this.props.email;
  }

  get username(): string {
    return this.props.username;
  }

  get emailVerified(): boolean {
    return this.props.emailVerified;
  }

  get isEmailVerified(): boolean {
    return this.props.emailVerified;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  get isAdmin(): boolean {
    return this.props.isAdmin;
  }

  get spamScore(): number {
    return this.props.spamScore;
  }

  get isBlocked(): boolean {
    return this.props.spamScore >= 5;
  }

  // Factory method
  static create(data: UserCreate): UserEntity {
    const now = new Date();

    const user: User = {
      id: crypto.randomUUID(),
      email: data.email,
      username: data.username,
      passwordHash: data.passwordHash,
      fullName: data.fullName ?? null,
      bio: data.bio ?? null,
      avatarUrl: data.avatarUrl ?? null,
      socialLinks: data.socialLinks ?? {},
      emailVerified: data.emailVerified ?? false,
      isActive: data.isActive ?? true,
      isAdmin: data.isAdmin ?? false,
      spamScore: data.spamScore ?? 0,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };

    // Validate
    UserSchema.parse(user);

    return new UserEntity(user);
  }

  // Business Rules

  /**
   * BR-01: User must verify email, be active, and not blocked to create posts
   */
  canCreatePost(): boolean {
    return this.props.emailVerified && this.props.isActive && !this.isBlocked;
  }

  /**
   * BR-01: Check if user can edit content (must be author or admin)
   */
  canEdit(authorId: string): boolean {
    return this.props.isAdmin || this.props.id === authorId;
  }

  /**
   * BR-01: Check if user can edit a post (must be author or admin)
   */
  canEditPost(authorId: string): boolean {
    return this.canEdit(authorId);
  }

  /**
   * BR-03: Check if user is likely a spammer
   */
  isSpammer(): boolean {
    return this.props.spamScore >= 5;
  }

  /**
   * Verify email
   */
  verifyEmail(): void {
    this.props.emailVerified = true;
    this.props.updatedAt = new Date();
  }

  /**
   * Increment spam score (when reported)
   */
  incrementSpamScore(): void {
    this.props.spamScore = Math.min(this.props.spamScore + 1, 100);
    this.props.updatedAt = new Date();
  }

  /**
   * Update profile
   */
  updateProfile(data: UserUpdate): void {
    if (data.fullName !== undefined) {
      this.props.fullName = data.fullName ?? null;
    }
    if (data.bio !== undefined) {
      this.props.bio = data.bio ?? null;
    }
    if (data.avatarUrl !== undefined) {
      this.props.avatarUrl = data.avatarUrl ?? null;
    }
    if (data.socialLinks !== undefined) {
      this.props.socialLinks = data.socialLinks;
    }
    this.props.updatedAt = new Date();
  }

  /**
   * Soft delete
   */
  softDelete(): void {
    this.props.deletedAt = new Date();
    this.props.isActive = false;
    this.props.updatedAt = new Date();
  }

  /**
   * Check if account is deleted (soft delete)
   */
  isDeleted(): boolean {
    return this.props.deletedAt !== null;
  }

  /**
   * Serialize to JSON
   */
  toJSON(): User {
    return { ...this.props };
  }

  /**
   * Serialize to profile (public fields only)
   */
  toProfile() {
    return {
      id: this.props.id,
      username: this.props.username,
      fullName: this.props.fullName,
      bio: this.props.bio,
      avatarUrl: this.props.avatarUrl,
      socialLinks: this.props.socialLinks,
      createdAt: this.props.createdAt,
    };
  }

  /**
   * Convert to DTO (without sensitive data)
   */
  toDto(): UserResponseDto {
    return UserResponseDtoSchema.parse(this.props);
  }
}
