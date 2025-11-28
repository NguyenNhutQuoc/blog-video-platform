import { z } from 'zod';

/**
 * Tag Entity - Blog post tags
 *
 * Represents a tag that can be assigned to posts.
 * Tags are flat (no hierarchy) and track usage count.
 */

// =====================================================
// ZOD SCHEMAS
// =====================================================

/**
 * Tag name validation: 2-30 characters
 */
const TagNameSchema = z
  .string()
  .min(2, 'Tag name must be at least 2 characters')
  .max(30, 'Tag name must be at most 30 characters')
  .trim();

/**
 * Slug validation: URL-friendly format
 */
const SlugSchema = z
  .string()
  .min(1)
  .max(50)
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    'Slug must be lowercase letters, numbers, and hyphens only'
  );

// =====================================================
// ENTITY SCHEMA
// =====================================================

export const TagSchema = z.object({
  id: z.string().uuid(),
  name: TagNameSchema,
  slug: SlugSchema,
  usageCount: z.number().int().min(0).default(0),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// =====================================================
// DTOs
// =====================================================

/**
 * Create Tag DTO
 */
export const CreateTagDtoSchema = z.object({
  name: TagNameSchema,
  slug: SlugSchema.optional(),
});

/**
 * Update Tag DTO
 */
export const UpdateTagDtoSchema = z.object({
  name: TagNameSchema.optional(),
  slug: SlugSchema.optional(),
});

/**
 * Tag Response DTO
 */
export const TagResponseDtoSchema = TagSchema;

/**
 * Popular Tags DTO
 */
export const PopularTagsDtoSchema = z.array(
  z.object({
    id: z.string().uuid(),
    name: z.string(),
    slug: z.string(),
    usageCount: z.number(),
  })
);

// =====================================================
// TYPE INFERENCE
// =====================================================

export type Tag = z.infer<typeof TagSchema>;
export type TagCreate = {
  name: string;
  slug?: string;
};
export type TagUpdate = Partial<Pick<Tag, 'name' | 'slug'>>;
export type CreateTagDto = z.infer<typeof CreateTagDtoSchema>;
export type UpdateTagDto = z.infer<typeof UpdateTagDtoSchema>;
export type TagResponseDto = z.infer<typeof TagResponseDtoSchema>;
export type PopularTagsDto = z.infer<typeof PopularTagsDtoSchema>;

// =====================================================
// DOMAIN LOGIC
// =====================================================

export class TagEntity {
  constructor(private readonly props: Tag) {}

  // Getters
  get id(): string {
    return this.props.id;
  }

  get name(): string {
    return this.props.name;
  }

  get slug(): string {
    return this.props.slug;
  }

  get usageCount(): number {
    return this.props.usageCount;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // Factory method
  static create(data: TagCreate): TagEntity {
    const now = new Date();
    const slug = data.slug ?? TagEntity.generateSlug(data.name);

    const tag: Tag = {
      id: crypto.randomUUID(),
      name: data.name,
      slug,
      usageCount: 0,
      createdAt: now,
      updatedAt: now,
    };

    // Validate
    TagSchema.parse(tag);

    return new TagEntity(tag);
  }

  /**
   * Reconstitute from persistence
   */
  static fromPersistence(data: Tag): TagEntity {
    return new TagEntity(data);
  }

  // Business Rules

  /**
   * Generate slug from tag name
   */
  static generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Check if can be deleted (not used by any posts)
   */
  canBeDeleted(): boolean {
    return this.props.usageCount === 0;
  }

  /**
   * Check if tag is trending (high usage)
   */
  isTrending(threshold = 10): boolean {
    return this.props.usageCount >= threshold;
  }

  /**
   * Normalize tag name for comparison
   */
  static normalize(name: string): string {
    return name.toLowerCase().trim();
  }

  /**
   * Check if two tag names are equivalent
   */
  static areEquivalent(name1: string, name2: string): boolean {
    return TagEntity.normalize(name1) === TagEntity.normalize(name2);
  }

  // Mutations

  /**
   * Update tag details
   */
  update(data: TagUpdate): void {
    if (data.name !== undefined) {
      this.props.name = data.name;
      // Regenerate slug if not explicitly provided
      if (data.slug === undefined) {
        this.props.slug = TagEntity.generateSlug(data.name);
      }
    }
    if (data.slug !== undefined) {
      this.props.slug = data.slug;
    }
    this.props.updatedAt = new Date();
  }

  /**
   * Rename tag
   */
  rename(newName: string): void {
    this.props.name = newName;
    this.props.slug = TagEntity.generateSlug(newName);
    this.props.updatedAt = new Date();
  }

  /**
   * Increment usage count
   */
  incrementUsageCount(): void {
    this.props.usageCount += 1;
  }

  /**
   * Decrement usage count
   */
  decrementUsageCount(): void {
    this.props.usageCount = Math.max(0, this.props.usageCount - 1);
  }

  // Serialization

  /**
   * Serialize to JSON
   */
  toJSON(): Tag {
    return { ...this.props };
  }

  /**
   * Serialize for autocomplete/dropdown
   */
  toOption(): { value: string; label: string } {
    return {
      value: this.props.id,
      label: this.props.name,
    };
  }

  /**
   * Serialize for tag cloud
   */
  toCloudItem(): { name: string; slug: string; count: number } {
    return {
      name: this.props.name,
      slug: this.props.slug,
      count: this.props.usageCount,
    };
  }
}
