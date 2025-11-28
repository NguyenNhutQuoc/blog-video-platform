import { z } from 'zod';

/**
 * Password Value Object
 * Immutable object representing a validated password
 *
 * Rules:
 * - Min 8 characters
 * - At least 1 uppercase letter
 * - At least 1 lowercase letter
 * - At least 1 number
 * - At least 1 special character (@$!%*?&)
 */

const PasswordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must be at most 128 characters')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(
    /[@$!%*?&]/,
    'Password must contain at least one special character (@$!%*?&)'
  );

/**
 * Password strength levels
 */
export type PasswordStrength = 'weak' | 'fair' | 'good' | 'strong';

export class Password {
  private constructor(private readonly value: string) {
    Object.freeze(this);
  }

  /**
   * Factory method to create a validated Password
   * @throws ZodError if validation fails
   */
  static create(password: string): Password {
    PasswordSchema.parse(password);
    return new Password(password);
  }

  /**
   * Get the password value (for hashing)
   * Should only be used when hashing the password
   */
  getValue(): string {
    return this.value;
  }

  /**
   * Calculate password strength
   */
  getStrength(): PasswordStrength {
    let score = 0;

    // Length bonus
    if (this.value.length >= 12) score += 2;
    else if (this.value.length >= 10) score += 1;

    // Character variety
    if (/[a-z]/.test(this.value)) score += 1;
    if (/[A-Z]/.test(this.value)) score += 1;
    if (/[0-9]/.test(this.value)) score += 1;
    if (/[@$!%*?&]/.test(this.value)) score += 1;

    // Extra complexity
    if (/[^a-zA-Z0-9@$!%*?&]/.test(this.value)) score += 1; // Other special chars
    if (this.value.length >= 16) score += 1;

    if (score >= 7) return 'strong';
    if (score >= 5) return 'good';
    if (score >= 3) return 'fair';
    return 'weak';
  }

  /**
   * Check if password contains common patterns to avoid
   */
  hasCommonPatterns(): boolean {
    const commonPatterns = [
      /^password/i,
      /^123456/,
      /^qwerty/i,
      /(.)\1{2,}/, // 3+ repeated characters
      /^[a-z]+$/i, // Only letters
      /^[0-9]+$/, // Only numbers
    ];

    return commonPatterns.some((pattern) => pattern.test(this.value));
  }

  /**
   * Check equality with another Password
   */
  equals(other: Password): boolean {
    return this.value === other.value;
  }

  /**
   * String representation (masked for security)
   */
  toString(): string {
    return '********';
  }

  /**
   * Prevent JSON serialization of password
   */
  toJSON(): string {
    return '[REDACTED]';
  }
}
