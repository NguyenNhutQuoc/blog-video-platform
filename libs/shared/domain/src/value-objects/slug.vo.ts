import { z } from 'zod';

/**
 * Slug Value Object
 * Immutable object representing a URL-friendly slug
 *
 * Rules:
 * - Only lowercase letters, numbers, and hyphens
 * - Cannot start or end with hyphen
 * - No consecutive hyphens
 * - 1-250 characters
 */

const SlugSchema = z
  .string()
  .min(1, 'Slug must not be empty')
  .max(250, 'Slug must be at most 250 characters')
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Invalid slug format');

export class Slug {
  private constructor(private readonly value: string) {
    Object.freeze(this);
  }

  /**
   * Factory method to create a validated Slug
   * @throws ZodError if validation fails
   */
  static create(slug: string): Slug {
    const validated = SlugSchema.parse(slug);
    return new Slug(validated);
  }

  /**
   * Create Slug from trusted source (e.g., database)
   * Skips validation for performance
   */
  static fromPersistence(slug: string): Slug {
    return new Slug(slug);
  }

  /**
   * Generate a slug from any text
   */
  static fromText(text: string): Slug {
    const slugified = text
      .toLowerCase()
      .trim()
      .replace(/[^\p{L}\p{N}\s-]/gu, '') // Remove special chars (Unicode aware)
      .replace(/\s+/g, '-') // Spaces to hyphens
      .replace(/-+/g, '-') // Multiple hyphens to single
      .replace(/^-+|-+$/g, ''); // Trim hyphens

    // If empty after processing, generate a random slug
    if (!slugified) {
      return new Slug(`post-${Date.now()}`);
    }

    return new Slug(slugified);
  }

  /**
   * Generate a unique slug by appending a suffix
   * Useful when slug already exists in database
   */
  withSuffix(suffix: string | number): Slug {
    return new Slug(`${this.value}-${suffix}`);
  }

  /**
   * Generate a unique slug by appending timestamp
   */
  makeUnique(): Slug {
    const timestamp = Date.now().toString(36);
    return new Slug(`${this.value}-${timestamp}`);
  }

  /**
   * Get the slug value
   */
  getValue(): string {
    return this.value;
  }

  /**
   * Check equality with another Slug
   */
  equals(other: Slug): boolean {
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
