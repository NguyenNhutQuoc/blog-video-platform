import { z } from 'zod';

/**
 * Bookmark Entity - Saved posts by users
 *
 * Represents a bookmark action from a user on a post.
 * Bookmarks can be organized into folders.
 */

// =====================================================
// ENTITY SCHEMA
// =====================================================

export const BookmarkSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  postId: z.string().uuid(),
  folderId: z.string().uuid().nullable().default(null),
  note: z.string().max(500).nullable().default(null),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// =====================================================
// DTOs
// =====================================================

export const CreateBookmarkDtoSchema = z.object({
  postId: z.string().uuid(),
  folderId: z.string().uuid().optional(),
  note: z.string().max(500).optional(),
});

export const UpdateBookmarkDtoSchema = z.object({
  folderId: z.string().uuid().nullable().optional(),
  note: z.string().max(500).nullable().optional(),
});

export const BookmarkResponseDtoSchema = BookmarkSchema.extend({
  post: z
    .object({
      id: z.string().uuid(),
      title: z.string(),
      slug: z.string(),
      excerpt: z.string().nullable(),
      featuredImageUrl: z.string().url().nullable(),
    })
    .optional(),
  folder: z
    .object({
      id: z.string().uuid(),
      name: z.string(),
      color: z.string().nullable(),
    })
    .optional(),
});

// =====================================================
// TYPE INFERENCE
// =====================================================

export type Bookmark = z.infer<typeof BookmarkSchema>;
export type BookmarkCreate = {
  userId: string;
  postId: string;
  folderId?: string | null;
  note?: string | null;
};
export type BookmarkUpdate = Partial<Pick<Bookmark, 'folderId' | 'note'>>;
export type CreateBookmarkDto = z.infer<typeof CreateBookmarkDtoSchema>;
export type UpdateBookmarkDto = z.infer<typeof UpdateBookmarkDtoSchema>;
export type BookmarkResponseDto = z.infer<typeof BookmarkResponseDtoSchema>;

// =====================================================
// DOMAIN LOGIC
// =====================================================

export class BookmarkEntity {
  constructor(private readonly props: Bookmark) {}

  // Getters
  get id(): string {
    return this.props.id;
  }

  get userId(): string {
    return this.props.userId;
  }

  get postId(): string {
    return this.props.postId;
  }

  get folderId(): string | null {
    return this.props.folderId;
  }

  get note(): string | null {
    return this.props.note;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // Factory method
  static create(data: BookmarkCreate): BookmarkEntity {
    const now = new Date();

    const bookmark: Bookmark = {
      id: crypto.randomUUID(),
      userId: data.userId,
      postId: data.postId,
      folderId: data.folderId ?? null,
      note: data.note ?? null,
      createdAt: now,
      updatedAt: now,
    };

    // Validate
    BookmarkSchema.parse(bookmark);

    return new BookmarkEntity(bookmark);
  }

  /**
   * Reconstitute from persistence
   */
  static fromPersistence(data: Bookmark): BookmarkEntity {
    return new BookmarkEntity(data);
  }

  // Mutations

  /**
   * Move bookmark to a different folder
   */
  moveToFolder(folderId: string | null): void {
    this.props.folderId = folderId;
    this.props.updatedAt = new Date();
  }

  /**
   * Update bookmark note
   */
  updateNote(note: string | null): void {
    this.props.note = note;
    this.props.updatedAt = new Date();
  }

  /**
   * Update bookmark
   */
  update(data: BookmarkUpdate): void {
    if (data.folderId !== undefined) {
      this.props.folderId = data.folderId;
    }
    if (data.note !== undefined) {
      this.props.note = data.note;
    }
    this.props.updatedAt = new Date();
  }

  // Serialization

  /**
   * Serialize to JSON
   */
  toJSON(): Bookmark {
    return { ...this.props };
  }
}
