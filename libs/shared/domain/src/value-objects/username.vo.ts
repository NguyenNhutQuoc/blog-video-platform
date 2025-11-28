import { z } from 'zod';

/**
 * Username Value Object
 * Immutable object representing a validated username
 *
 * Rules:
 * - Only lowercase letters, numbers, underscore, hyphen
 * - 3-50 characters
 * - Cannot start or end with special characters
 */

const UsernameSchema = z
  .string()
  .min(3, 'Username must be at least 3 characters')
  .max(50, 'Username must be at most 50 characters')
  .regex(
    /^[a-z0-9][a-z0-9_-]*[a-z0-9]$|^[a-z0-9]$/,
    'Username must start and end with letter/number, can contain _ and -'
  )
  .regex(
    /^[a-z0-9_-]+$/,
    'Username can only contain lowercase letters, numbers, _ and -'
  );

export class Username {
  private constructor(private readonly value: string) {
    Object.freeze(this);
  }

  /**
   * Factory method to create a validated Username
   * @throws ZodError if validation fails
   */
  static create(username: string): Username {
    const validated = UsernameSchema.parse(username.toLowerCase());
    return new Username(validated);
  }

  /**
   * Create Username from trusted source (e.g., database)
   * Skips validation for performance
   */
  static fromPersistence(username: string): Username {
    return new Username(username);
  }

  /**
   * Check if username is reserved
   */
  static isReserved(username: string): boolean {
    const reserved = [
      'admin',
      'administrator',
      'root',
      'system',
      'api',
      'www',
      'mail',
      'email',
      'support',
      'help',
      'info',
      'blog',
      'news',
      'login',
      'logout',
      'signup',
      'signin',
      'register',
      'settings',
      'profile',
      'account',
      'dashboard',
      'null',
      'undefined',
      'moderator',
      'mod',
    ];
    return reserved.includes(username.toLowerCase());
  }

  /**
   * Get the username value
   */
  getValue(): string {
    return this.value;
  }

  /**
   * Check equality with another Username
   */
  equals(other: Username): boolean {
    return this.value === other.value;
  }

  /**
   * String representation
   */
  toString(): string {
    return this.value;
  }

  /**
   * JSON serialization
   */
  toJSON(): string {
    return this.value;
  }
}
