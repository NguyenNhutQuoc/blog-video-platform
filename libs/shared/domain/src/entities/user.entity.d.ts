import { z } from 'zod';
/**
 * Password validation:
 * - Min 8 characters
 * - At least 1 uppercase, 1 lowercase, 1 number, 1 special char
 */
export declare const PasswordSchema: z.ZodString;
/**
 * User Entity Schema (Database model)
 */
export declare const UserSchema: z.ZodObject<{
    id: z.ZodString;
    email: z.ZodString;
    username: z.ZodString;
    passwordHash: z.ZodString;
    fullName: z.ZodDefault<z.ZodNullable<z.ZodString>>;
    bio: z.ZodDefault<z.ZodNullable<z.ZodString>>;
    avatarUrl: z.ZodDefault<z.ZodNullable<z.ZodString>>;
    socialLinks: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodOptional<z.ZodURL>>>;
    emailVerified: z.ZodDefault<z.ZodBoolean>;
    isActive: z.ZodDefault<z.ZodBoolean>;
    isAdmin: z.ZodDefault<z.ZodBoolean>;
    spamScore: z.ZodDefault<z.ZodNumber>;
    failedLoginAttempts: z.ZodDefault<z.ZodNumber>;
    lockedUntil: z.ZodDefault<z.ZodNullable<z.ZodDate>>;
    lastLoginAt: z.ZodDefault<z.ZodNullable<z.ZodDate>>;
    passwordChangedAt: z.ZodDefault<z.ZodNullable<z.ZodDate>>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
    deletedAt: z.ZodDefault<z.ZodNullable<z.ZodDate>>;
}, z.core.$strip>;
/**
 * Create User DTO (for registration)
 */
export declare const CreateUserDtoSchema: z.ZodObject<{
    email: z.ZodString;
    username: z.ZodString;
    password: z.ZodString;
    fullName: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
/**
 * Update User Profile DTO
 */
export declare const UpdateUserProfileDtoSchema: z.ZodObject<{
    fullName: z.ZodOptional<z.ZodString>;
    bio: z.ZodOptional<z.ZodString>;
    avatarUrl: z.ZodOptional<z.ZodString>;
    socialLinks: z.ZodOptional<z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodOptional<z.ZodURL>>>>;
}, z.core.$strip>;
/**
 * Change Password DTO
 */
export declare const ChangePasswordDtoSchema: z.ZodObject<{
    currentPassword: z.ZodString;
    newPassword: z.ZodString;
    confirmPassword: z.ZodString;
}, z.core.$strip>;
/**
 * User Response DTO (without sensitive data)
 */
export declare const UserResponseDtoSchema: z.ZodObject<{
    email: z.ZodString;
    username: z.ZodString;
    socialLinks: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodOptional<z.ZodURL>>>;
    spamScore: z.ZodDefault<z.ZodNumber>;
    id: z.ZodString;
    fullName: z.ZodDefault<z.ZodNullable<z.ZodString>>;
    bio: z.ZodDefault<z.ZodNullable<z.ZodString>>;
    avatarUrl: z.ZodDefault<z.ZodNullable<z.ZodString>>;
    emailVerified: z.ZodDefault<z.ZodBoolean>;
    isActive: z.ZodDefault<z.ZodBoolean>;
    isAdmin: z.ZodDefault<z.ZodBoolean>;
    failedLoginAttempts: z.ZodDefault<z.ZodNumber>;
    lockedUntil: z.ZodDefault<z.ZodNullable<z.ZodDate>>;
    lastLoginAt: z.ZodDefault<z.ZodNullable<z.ZodDate>>;
    passwordChangedAt: z.ZodDefault<z.ZodNullable<z.ZodDate>>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, z.core.$strip>;
export type User = z.infer<typeof UserSchema>;
export type UserCreate = Omit<User, 'id' | 'createdAt' | 'updatedAt'>;
export type UserUpdate = Partial<Pick<User, 'fullName' | 'bio' | 'avatarUrl' | 'socialLinks'>>;
export type CreateUserDto = z.infer<typeof CreateUserDtoSchema>;
export type UpdateUserProfileDto = z.infer<typeof UpdateUserProfileDtoSchema>;
export type ChangePasswordDto = z.infer<typeof ChangePasswordDtoSchema>;
export type UserResponseDto = z.infer<typeof UserResponseDtoSchema>;
export declare class UserEntity {
    private readonly props;
    constructor(props: User);
    get id(): string;
    get email(): string;
    get username(): string;
    get emailVerified(): boolean;
    get isEmailVerified(): boolean;
    get isActive(): boolean;
    get isAdmin(): boolean;
    get spamScore(): number;
    get isBlocked(): boolean;
    get failedLoginAttempts(): number;
    get lockedUntil(): Date | null;
    get lastLoginAt(): Date | null;
    get passwordChangedAt(): Date | null;
    static create(data: UserCreate): UserEntity;
    /**
     * BR-01: User must verify email, be active, and not blocked to create posts
     */
    canCreatePost(): boolean;
    /**
     * BR-01: Check if user can edit content (must be author or admin)
     */
    canEdit(authorId: string): boolean;
    /**
     * BR-01: Check if user can edit a post (must be author or admin)
     */
    canEditPost(authorId: string): boolean;
    /**
     * BR-03: Check if user is likely a spammer
     */
    isSpammer(): boolean;
    /**
     * Check if account is currently locked
     */
    isLocked(): boolean;
    /**
     * Get remaining lockout time in minutes (0 if not locked)
     */
    getRemainingLockoutMinutes(): number;
    /**
     * Record a failed login attempt
     */
    recordFailedLogin(): void;
    /**
     * Lock the account until a specific date
     */
    lockAccount(until: Date): void;
    /**
     * Unlock the account and reset failed attempts
     */
    unlockAccount(): void;
    /**
     * Record a successful login (resets failed attempts, updates lastLoginAt)
     */
    recordSuccessfulLogin(): void;
    /**
     * Verify email
     */
    verifyEmail(): void;
    /**
     * Change password (with pre-hashed password)
     */
    changePassword(newPasswordHash: string): void;
    /**
     * Increment spam score (when reported)
     */
    incrementSpamScore(): void;
    /**
     * Update profile
     */
    updateProfile(data: UserUpdate): void;
    /**
     * Soft delete
     */
    softDelete(): void;
    /**
     * Check if account is deleted (soft delete)
     */
    isDeleted(): boolean;
    /**
     * Serialize to JSON
     */
    toJSON(): User;
    /**
     * Serialize to profile (public fields only)
     */
    toProfile(): {
        id: string;
        username: string;
        fullName: string | null;
        bio: string | null;
        avatarUrl: string | null;
        socialLinks: Record<string, string | undefined>;
        createdAt: Date;
    };
    /**
     * Convert to DTO (without sensitive data)
     */
    toDto(): UserResponseDto;
}
//# sourceMappingURL=user.entity.d.ts.map