import { z } from 'zod';

/**
 * Bookmark Folder Entity - Organization for bookmarks
 *
 * Users can create folders to organize their bookmarked posts.
 */

// =====================================================
// ZOD SCHEMAS
// =====================================================

const FolderNameSchema = z
  .string()
  .min(1, 'Folder name is required')
  .max(50, 'Folder name must be at most 50 characters')
  .trim();

// =====================================================
// ENTITY SCHEMA
// =====================================================

export const BookmarkFolderSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  name: FolderNameSchema,
  description: z.string().max(200).nullable().default(null),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .nullable()
    .default(null),
  sortOrder: z.number().int().min(0).default(0),
  isDefault: z.boolean().default(false),
  bookmarkCount: z.number().int().min(0).default(0),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// =====================================================
// DTOs
// =====================================================

export const CreateBookmarkFolderDtoSchema = z.object({
  name: FolderNameSchema,
  description: z.string().max(200).optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),
});

export const UpdateBookmarkFolderDtoSchema = z.object({
  name: FolderNameSchema.optional(),
  description: z.string().max(200).nullable().optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .nullable()
    .optional(),
  sortOrder: z.number().int().min(0).optional(),
});

// =====================================================
// TYPE INFERENCE
// =====================================================

export type BookmarkFolder = z.infer<typeof BookmarkFolderSchema>;
export type BookmarkFolderCreate = {
  userId: string;
  name: string;
  description?: string | null;
  color?: string | null;
  sortOrder?: number;
  isDefault?: boolean;
};
export type BookmarkFolderUpdate = Partial<
  Pick<BookmarkFolder, 'name' | 'description' | 'color' | 'sortOrder'>
>;
export type CreateBookmarkFolderDto = z.infer<
  typeof CreateBookmarkFolderDtoSchema
>;
export type UpdateBookmarkFolderDto = z.infer<
  typeof UpdateBookmarkFolderDtoSchema
>;

// =====================================================
// DOMAIN LOGIC
// =====================================================

export class BookmarkFolderEntity {
  constructor(private readonly props: BookmarkFolder) {}

  // Getters
  get id(): string {
    return this.props.id;
  }

  get userId(): string {
    return this.props.userId;
  }

  get name(): string {
    return this.props.name;
  }

  get description(): string | null {
    return this.props.description;
  }

  get color(): string | null {
    return this.props.color;
  }

  get sortOrder(): number {
    return this.props.sortOrder;
  }

  get isDefault(): boolean {
    return this.props.isDefault;
  }

  get bookmarkCount(): number {
    return this.props.bookmarkCount;
  }

  // Factory method
  static create(data: BookmarkFolderCreate): BookmarkFolderEntity {
    const now = new Date();

    const folder: BookmarkFolder = {
      id: crypto.randomUUID(),
      userId: data.userId,
      name: data.name,
      description: data.description ?? null,
      color: data.color ?? null,
      sortOrder: 0,
      isDefault: data.isDefault ?? false,
      bookmarkCount: 0,
      createdAt: now,
      updatedAt: now,
    };

    // Validate
    BookmarkFolderSchema.parse(folder);

    return new BookmarkFolderEntity(folder);
  }

  /**
   * Reconstitute from persistence
   */
  static fromPersistence(data: BookmarkFolder): BookmarkFolderEntity {
    return new BookmarkFolderEntity(data);
  }

  /**
   * Create default folder for user
   */
  static createDefault(userId: string): BookmarkFolderEntity {
    return BookmarkFolderEntity.create({
      userId,
      name: 'Saved',
      description: 'Default bookmark folder',
      isDefault: true,
    });
  }

  // Business Rules

  /**
   * Check if folder can be deleted
   * Default folder cannot be deleted
   */
  canBeDeleted(): boolean {
    return !this.props.isDefault;
  }

  /**
   * Check if folder is empty
   */
  isEmpty(): boolean {
    return this.props.bookmarkCount === 0;
  }

  // Mutations

  /**
   * Update folder details
   */
  update(data: BookmarkFolderUpdate): void {
    if (data.name !== undefined) {
      this.props.name = data.name;
    }
    if (data.description !== undefined) {
      this.props.description = data.description;
    }
    if (data.color !== undefined) {
      this.props.color = data.color;
    }
    if (data.sortOrder !== undefined) {
      this.props.sortOrder = data.sortOrder;
    }
    this.props.updatedAt = new Date();
  }

  /**
   * Rename folder
   */
  rename(newName: string): void {
    this.props.name = newName;
    this.props.updatedAt = new Date();
  }

  /**
   * Increment bookmark count
   */
  incrementBookmarkCount(): void {
    this.props.bookmarkCount += 1;
  }

  /**
   * Decrement bookmark count
   */
  decrementBookmarkCount(): void {
    this.props.bookmarkCount = Math.max(0, this.props.bookmarkCount - 1);
  }

  // Serialization

  /**
   * Serialize to JSON
   */
  toJSON(): BookmarkFolder {
    return { ...this.props };
  }

  /**
   * Serialize for sidebar/list
   */
  toListItem(): {
    id: string;
    name: string;
    color: string | null;
    count: number;
  } {
    return {
      id: this.props.id,
      name: this.props.name,
      color: this.props.color,
      count: this.props.bookmarkCount,
    };
  }
}
