import { z } from 'zod';

/**
 * Category Entity - Blog post categories
 *
 * Represents a category that can be assigned to posts.
 * Categories are hierarchical (parent-child) and have post counts.
 */

// =====================================================
// ZOD SCHEMAS
// =====================================================

/**
 * Category name validation: 2-50 characters
 */
const CategoryNameSchema = z
  .string()
  .min(2, 'Category name must be at least 2 characters')
  .max(50, 'Category name must be at most 50 characters')
  .trim();

/**
 * Slug validation: URL-friendly format
 */
const SlugSchema = z
  .string()
  .min(1)
  .max(100)
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    'Slug must be lowercase letters, numbers, and hyphens only'
  );

/**
 * Description validation
 */
const DescriptionSchema = z.string().max(200).nullable().default(null);

// =====================================================
// ENTITY SCHEMA
// =====================================================

export const CategorySchema = z.object({
  id: z.string().uuid(),
  name: CategoryNameSchema,
  slug: SlugSchema,
  description: DescriptionSchema,
  parentId: z.string().uuid().nullable().default(null),
  postCount: z.number().int().min(0).default(0),
  sortOrder: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// =====================================================
// DTOs
// =====================================================

/**
 * Create Category DTO
 */
export const CreateCategoryDtoSchema = z.object({
  name: CategoryNameSchema,
  slug: SlugSchema.optional(),
  description: DescriptionSchema.optional(),
  parentId: z.string().uuid().optional(),
  sortOrder: z.number().int().min(0).optional(),
});

/**
 * Update Category DTO
 */
export const UpdateCategoryDtoSchema = z.object({
  name: CategoryNameSchema.optional(),
  slug: SlugSchema.optional(),
  description: DescriptionSchema.optional(),
  parentId: z.string().uuid().nullable().optional(),
  sortOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

/**
 * Category Response DTO (with children)
 */
export const CategoryResponseDtoSchema: z.ZodType<any> = CategorySchema.extend({
  children: z.array(z.lazy(() => CategoryResponseDtoSchema)).optional(),
});

/**
 * Category Tree DTO (for navigation)
 */
export const CategoryTreeDtoSchema: z.ZodType<any> = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  postCount: z.number(),
  children: z.array(z.lazy(() => CategoryTreeDtoSchema)).default([]),
});

// =====================================================
// TYPE INFERENCE
// =====================================================

export type Category = z.infer<typeof CategorySchema>;
export type CategoryCreate = {
  name: string;
  slug?: string;
  description?: string | null;
  parentId?: string | null;
  sortOrder?: number;
};
export type CategoryUpdate = Partial<
  Pick<
    Category,
    'name' | 'slug' | 'description' | 'parentId' | 'sortOrder' | 'isActive'
  >
>;
export type CreateCategoryDto = z.infer<typeof CreateCategoryDtoSchema>;
export type UpdateCategoryDto = z.infer<typeof UpdateCategoryDtoSchema>;
export type CategoryResponseDto = z.infer<typeof CategoryResponseDtoSchema>;
export type CategoryTreeDto = z.infer<typeof CategoryTreeDtoSchema>;

// =====================================================
// DOMAIN LOGIC
// =====================================================

export class CategoryEntity {
  constructor(private readonly props: Category) {}

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

  get description(): string | null {
    return this.props.description;
  }

  get parentId(): string | null {
    return this.props.parentId;
  }

  get postCount(): number {
    return this.props.postCount;
  }

  get sortOrder(): number {
    return this.props.sortOrder;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  get isRoot(): boolean {
    return this.props.parentId === null;
  }

  // Factory method
  static create(data: CategoryCreate): CategoryEntity {
    const now = new Date();
    const slug = data.slug ?? CategoryEntity.generateSlug(data.name);

    const category: Category = {
      id: crypto.randomUUID(),
      name: data.name,
      slug,
      description: data.description ?? null,
      parentId: data.parentId ?? null,
      postCount: 0,
      sortOrder: data.sortOrder ?? 0,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    // Validate
    CategorySchema.parse(category);

    return new CategoryEntity(category);
  }

  /**
   * Reconstitute from persistence
   */
  static fromPersistence(data: Category): CategoryEntity {
    return new CategoryEntity(data);
  }

  // Business Rules

  /**
   * Generate slug from category name
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
   * Check if can be deleted (no posts assigned)
   */
  canBeDeleted(): boolean {
    return this.props.postCount === 0;
  }

  /**
   * Check if category is displayable (active with posts)
   */
  isDisplayable(): boolean {
    return this.props.isActive && this.props.postCount > 0;
  }

  // Mutations

  /**
   * Update category details
   */
  update(data: CategoryUpdate): void {
    if (data.name !== undefined) {
      this.props.name = data.name;
      // Regenerate slug if not explicitly provided
      if (data.slug === undefined) {
        this.props.slug = CategoryEntity.generateSlug(data.name);
      }
    }
    if (data.slug !== undefined) {
      this.props.slug = data.slug;
    }
    if (data.description !== undefined) {
      this.props.description = data.description;
    }
    if (data.parentId !== undefined) {
      this.props.parentId = data.parentId;
    }
    if (data.sortOrder !== undefined) {
      this.props.sortOrder = data.sortOrder;
    }
    if (data.isActive !== undefined) {
      this.props.isActive = data.isActive;
    }
    this.props.updatedAt = new Date();
  }

  /**
   * Activate category
   */
  activate(): void {
    this.props.isActive = true;
    this.props.updatedAt = new Date();
  }

  /**
   * Deactivate category
   */
  deactivate(): void {
    this.props.isActive = false;
    this.props.updatedAt = new Date();
  }

  /**
   * Move to different parent
   */
  moveTo(parentId: string | null): void {
    if (parentId === this.props.id) {
      throw new Error('Category cannot be its own parent');
    }
    this.props.parentId = parentId;
    this.props.updatedAt = new Date();
  }

  /**
   * Increment post count
   */
  incrementPostCount(): void {
    this.props.postCount += 1;
  }

  /**
   * Decrement post count
   */
  decrementPostCount(): void {
    this.props.postCount = Math.max(0, this.props.postCount - 1);
  }

  // Serialization

  /**
   * Serialize to JSON
   */
  toJSON(): Category {
    return { ...this.props };
  }

  /**
   * Serialize for navigation/tree
   */
  toTreeNode(): CategoryTreeDto {
    return {
      id: this.props.id,
      name: this.props.name,
      slug: this.props.slug,
      postCount: this.props.postCount,
      children: [],
    };
  }

  /**
   * Serialize for dropdown/select
   */
  toOption(): { value: string; label: string } {
    return {
      value: this.props.id,
      label: this.props.name,
    };
  }
}
