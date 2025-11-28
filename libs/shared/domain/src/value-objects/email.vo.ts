import { z } from 'zod';

/**
 * Email Value Object
 * Immutable object representing a validated email address
 */

// Zod schema for validation
const EmailSchema = z
  .string()
  .trim()
  .email('Invalid email format')
  .max(255, 'Email must be at most 255 characters')
  .transform((email) => email.toLowerCase());

export class Email {
  private constructor(private readonly value: string) {
    Object.freeze(this);
  }

  /**
   * Factory method to create a validated Email
   * @throws ZodError if validation fails
   */
  static create(email: string): Email {
    const validated = EmailSchema.parse(email);
    return new Email(validated);
  }

  /**
   * Create Email from trusted source (e.g., database)
   * Skips validation for performance
   */
  static fromPersistence(email: string): Email {
    return new Email(email);
  }

  /**
   * Get the email value
   */
  getValue(): string {
    return this.value;
  }

  /**
   * Get the domain part of the email
   */
  getDomain(): string {
    return this.value.split('@')[1];
  }

  /**
   * Get the local part of the email (before @)
   */
  getLocalPart(): string {
    return this.value.split('@')[0];
  }

  /**
   * Check equality with another Email
   */
  equals(other: Email): boolean {
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
