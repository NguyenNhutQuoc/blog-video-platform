import { z } from 'zod';

/**
 * Post Entity - Blog post with rich content
 */

// =====================================================
// ENUMS
// =====================================================

export const PostStatus = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ARCHIVED: 'archived',
} as const;

export const PostVisibility = {
  PUBLIC: 'public',
  PRIVATE: 'private',
  UNLISTED: 'unlisted',
} as const;

// =====================================================
// ZOD SCHEMAS
// =====================================================

/**
 * Title validation: 10-200 characters (BR-02)
 */
const TitleSchema = z
  .string()
  .min(10, 'Title must be at least 10 characters')
  .max(200, 'Title must be at most 200 characters');

/**
 * Slug validation: URL-friendly format
 */
const SlugSchema = z
  .string()
  .min(1)
  .max(250)
  .regex(
    /^[a-z0-9-]+$/,
    'Slug must be lowercase letters, numbers, and hyphens only'
  );

/**
 * Content validation: Min 50 characters (BR-02)
 */
const ContentSchema = z
  .string()
  .min(50, 'Content must be at least 50 characters');

/**
 * Excerpt: Auto-generated or manual
 */
const ExcerptSchema = z.string().max(200).nullable().default(null);

/**
 * Status validation
 */
const PostStatusSchema = z.enum([
  PostStatus.DRAFT,
  PostStatus.PUBLISHED,
  PostStatus.ARCHIVED,
]);

/**
 * Visibility validation
 */
const PostVisibilitySchema = z.enum([
  PostVisibility.PUBLIC,
  PostVisibility.PRIVATE,
  PostVisibility.UNLISTED,
]);

// =====================================================
// ENTITY SCHEMA
// =====================================================

/**
 * Video Schema (for embedded video data in Post)
 */
const VideoSchema = z
  .object({
    id: z.string().uuid(),
    status: z.string(),
    hlsUrl: z.string().url().nullable().default(null),
    thumbnailUrl: z.string().url().nullable().default(null),
    duration: z.number().nullable().default(null),
    width: z.number().nullable().default(null),
    height: z.number().nullable().default(null),
  })
  .nullable()
  .default(null);

export const PostSchema = z.object({
  id: z.string().uuid(),
  authorId: z.string().uuid(),
  title: TitleSchema,
  slug: SlugSchema,
  content: ContentSchema,
  excerpt: ExcerptSchema,
  featuredImageUrl: z.string().url().max(500).nullable().default(null),
  videoId: z.string().uuid().nullable().default(null),
  video: VideoSchema,
  status: PostStatusSchema.default(PostStatus.DRAFT),
  visibility: PostVisibilitySchema.default(PostVisibility.PUBLIC),
  viewCount: z.number().int().min(0).default(0),
  likeCount: z.number().int().min(0).default(0),
  commentCount: z.number().int().min(0).default(0),
  bookmarkCount: z.number().int().min(0).default(0),
  embedding: z.array(z.number()).length(1536).nullable().default(null), // Vector embeddings
  publishedAt: z.date().nullable().default(null),
  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().nullable().default(null),
});

// =====================================================
// DTOs
// =====================================================

/**
 * Create Post DTO
 */
export const CreatePostDtoSchema = z.object({
  title: TitleSchema,
  content: ContentSchema,
  excerpt: ExcerptSchema.optional(),
  featuredImageUrl: z.string().url().max(500).optional(),
  categoryIds: z
    .array(z.string().uuid())
    .min(1, 'At least one category required'),
  tagIds: z.array(z.string().uuid()).max(5, 'Maximum 5 tags allowed'), // BR-02
  videoId: z.string().uuid().optional(),
  status: PostStatusSchema.optional(),
  visibility: PostVisibilitySchema.optional(),
});

/**
 * Update Post DTO
 */
export const UpdatePostDtoSchema = z.object({
  title: TitleSchema.optional(),
  content: ContentSchema.optional(),
  excerpt: ExcerptSchema.optional(),
  featuredImageUrl: z.string().url().max(500).nullable().optional(),
  categoryIds: z.array(z.string().uuid()).optional(),
  tagIds: z.array(z.string().uuid()).max(5).optional(),
  status: PostStatusSchema.optional(),
  visibility: PostVisibilitySchema.optional(),
});

/**
 * Post Response DTO (with relations)
 */
export const PostResponseDtoSchema = PostSchema.extend({
  author: z.object({
    id: z.string().uuid(),
    username: z.string(),
    fullName: z.string().nullable(),
    avatarUrl: z.string().url().nullable(),
  }),
  categories: z.array(
    z.object({
      id: z.string().uuid(),
      name: z.string(),
      slug: z.string(),
    })
  ),
  tags: z.array(
    z.object({
      id: z.string().uuid(),
      name: z.string(),
      slug: z.string(),
    })
  ),
}).omit({
  deletedAt: true,
  embedding: true,
});

/**
 * Post Feed DTO (summary for lists)
 */
export const PostFeedDtoSchema = PostSchema.pick({
  id: true,
  title: true,
  slug: true,
  excerpt: true,
  featuredImageUrl: true,
  status: true,
  viewCount: true,
  likeCount: true,
  commentCount: true,
  publishedAt: true,
}).extend({
  author: z.object({
    username: z.string(),
    avatarUrl: z.string().url().nullable(),
  }),
  categories: z.array(z.object({ name: z.string(), slug: z.string() })),
});

// =====================================================
// TYPE INFERENCE
// =====================================================

export type Post = z.infer<typeof PostSchema>;
export type PostStatus = (typeof PostStatus)[keyof typeof PostStatus];
export type PostVisibility =
  (typeof PostVisibility)[keyof typeof PostVisibility];
export type PostCreate = Pick<Post, 'authorId' | 'title' | 'content'> & {
  excerpt?: string | null;
  featuredImageUrl?: string | null;
  videoId?: string | null;
  status?: PostStatus;
  visibility?: PostVisibility;
};
export type PostUpdate = Partial<
  Pick<
    Post,
    | 'title'
    | 'content'
    | 'excerpt'
    | 'featuredImageUrl'
    | 'videoId'
    | 'status'
    | 'visibility'
  >
>;
export type CreatePostDto = z.infer<typeof CreatePostDtoSchema>;
export type UpdatePostDto = z.infer<typeof UpdatePostDtoSchema>;
export type PostResponseDto = z.infer<typeof PostResponseDtoSchema>;
export type PostFeedDto = z.infer<typeof PostFeedDtoSchema>;

// =====================================================
// DOMAIN LOGIC
// =====================================================

export class PostEntity {
  constructor(private readonly props: Post) {}

  // Getters
  get id(): string {
    return this.props.id;
  }

  get authorId(): string {
    return this.props.authorId;
  }

  get title(): string {
    return this.props.title;
  }

  get slug(): string {
    return this.props.slug;
  }

  get status(): string {
    return this.props.status;
  }

  get visibility(): string {
    return this.props.visibility;
  }

  get isPublished(): boolean {
    return this.props.status === PostStatus.PUBLISHED;
  }

  // Factory method
  static create(data: PostCreate): PostEntity {
    const now = new Date();
    const slug = PostEntity.generateSlug(data.title);
    const excerpt = data.excerpt ?? PostEntity.generateExcerpt(data.content);

    const post: Post = {
      id: crypto.randomUUID(),
      authorId: data.authorId,
      title: data.title,
      slug,
      content: data.content,
      excerpt,
      featuredImageUrl: data.featuredImageUrl ?? null,
      videoId: data.videoId ?? null,
      video: null,
      status: data.status ?? PostStatus.DRAFT,
      visibility: data.visibility ?? PostVisibility.PUBLIC,
      viewCount: 0,
      likeCount: 0,
      commentCount: 0,
      bookmarkCount: 0,
      embedding: null,
      publishedAt: null,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };

    // Validate
    PostSchema.parse(post);

    return new PostEntity(post);
  }

  // Business Rules

  /**
   * Check if post is public
   */
  isPublic(): boolean {
    return (
      this.props.status === PostStatus.PUBLISHED &&
      this.props.visibility === PostVisibility.PUBLIC
    );
  }

  /**
   * BR-03: Check if title is unique (implemented at repository level)
   * This method prepares slug from title
   */
  static generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
      .replace(/\s+/g, '-') // Spaces to hyphens
      .replace(/-+/g, '-') // Multiple hyphens to single
      .replace(/^-+|-+$/g, ''); // Trim hyphens
  }

  /**
   * Generate excerpt from content (if not provided)
   */
  static generateExcerpt(content: string, maxLength = 200): string {
    // Remove HTML tags
    const plainText = content.replace(/<[^>]+>/g, '');
    // Take first maxLength chars
    if (plainText.length <= maxLength) {
      return plainText;
    }
    return plainText.substring(0, maxLength - 3) + '...';
  }

  /**
   * Publish post (set status and timestamp)
   */
  publish(): void {
    if (this.props.status === PostStatus.PUBLISHED) {
      throw new Error('Post is already published');
    }
    this.props.status = PostStatus.PUBLISHED;
    this.props.publishedAt = new Date();
    this.props.updatedAt = new Date();
  }

  /**
   * Unpublish post (back to draft)
   */
  unpublish(): void {
    if (this.props.status !== PostStatus.PUBLISHED) {
      throw new Error('Post is not published');
    }
    this.props.status = PostStatus.DRAFT;
    this.props.publishedAt = null;
    this.props.updatedAt = new Date();
  }

  /**
   * Archive post
   */
  archive(): void {
    this.props.status = PostStatus.ARCHIVED;
    this.props.updatedAt = new Date();
  }

  /**
   * Update post
   */
  update(data: PostUpdate): void {
    if (data.title !== undefined) {
      this.props.title = data.title;
      this.props.slug = PostEntity.generateSlug(data.title);
    }
    if (data.content !== undefined) {
      this.props.content = data.content;
      this.props.excerpt = PostEntity.generateExcerpt(data.content);
    }
    if (data.excerpt !== undefined) {
      this.props.excerpt = data.excerpt;
    }
    if (data.featuredImageUrl !== undefined) {
      this.props.featuredImageUrl = data.featuredImageUrl;
    }
    if (data.videoId !== undefined) {
      this.props.videoId = data.videoId;
    }
    if (data.status !== undefined) {
      this.props.status = data.status;
    }
    if (data.visibility !== undefined) {
      this.props.visibility = data.visibility;
    }
    this.props.updatedAt = new Date();
  }

  /**
   * Set embedding vector
   */
  setEmbedding(embedding: number[]): void {
    if (embedding.length !== 1536) {
      throw new Error('Embedding must be 1536 dimensions');
    }
    this.props.embedding = embedding;
    this.props.updatedAt = new Date();
  }

  /**
   * Increment view count
   */
  incrementViewCount(): void {
    this.props.viewCount += 1;
  }

  /**
   * Increment like count
   */
  incrementLikeCount(): void {
    this.props.likeCount += 1;
  }

  /**
   * Decrement like count
   */
  decrementLikeCount(): void {
    this.props.likeCount = Math.max(0, this.props.likeCount - 1);
  }

  /**
   * Increment comment count
   */
  incrementCommentCount(): void {
    this.props.commentCount += 1;
  }

  /**
   * Decrement comment count
   */
  decrementCommentCount(): void {
    this.props.commentCount = Math.max(0, this.props.commentCount - 1);
  }

  /**
   * Increment view count (alias)
   */
  incrementViews(): void {
    this.incrementViewCount();
  }

  /**
   * Soft delete
   */
  softDelete(): void {
    this.props.deletedAt = new Date();
    this.props.updatedAt = new Date();
  }

  /**
   * Check if deleted (soft delete)
   */
  isDeleted(): boolean {
    return this.props.deletedAt !== null;
  }

  /**
   * Check if content changed significantly (for re-embedding)
   * BR-05: Re-generate embedding if content changes > 20%
   */
  hasContentChangedSignificantly(newContent: string): boolean {
    const oldLength = this.props.content.length;
    const newLength = newContent.length;
    const lengthDiff = Math.abs(oldLength - newLength);
    const changePercentage = (lengthDiff / oldLength) * 100;

    return changePercentage > 20;
  }

  /**
   * Serialize to JSON
   */
  toJSON(): Post {
    return { ...this.props };
  }

  /**
   * Serialize to summary (for feed/list)
   */
  toSummary() {
    return {
      id: this.props.id,
      authorId: this.props.authorId,
      title: this.props.title,
      slug: this.props.slug,
      excerpt: this.props.excerpt,
      featuredImageUrl: this.props.featuredImageUrl,
      status: this.props.status,
      visibility: this.props.visibility,
      viewCount: this.props.viewCount,
      likeCount: this.props.likeCount,
      commentCount: this.props.commentCount,
      bookmarkCount: this.props.bookmarkCount,
      publishedAt: this.props.publishedAt,
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt,
    };
  }
}
