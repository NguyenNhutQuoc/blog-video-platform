import { z } from 'zod';

/**
 * Comment Entity - Blog post comments with 1-level reply
 */

// =====================================================
// ENUMS
// =====================================================

export const CommentStatus = {
  APPROVED: 'approved',
  PENDING_REVIEW: 'pending_review',
  HIDDEN: 'hidden',
} as const;

// =====================================================
// ZOD SCHEMAS
// =====================================================

/**
 * Content validation: 1-500 characters
 */
const CommentContentSchema = z
  .string()
  .min(1, 'Comment cannot be empty')
  .max(500, 'Comment must be at most 500 characters');

/**
 * Status validation
 */
const CommentStatusSchema = z.enum([
  CommentStatus.APPROVED,
  CommentStatus.PENDING_REVIEW,
  CommentStatus.HIDDEN,
]);

// =====================================================
// ENTITY SCHEMA
// =====================================================

export const CommentSchema = z.object({
  id: z.string().uuid(),
  postId: z.string().uuid(),
  userId: z.string().uuid(),
  parentId: z.string().uuid().nullable().default(null), // For 1-level reply
  content: CommentContentSchema,
  isFlagged: z.boolean().default(false),
  likeCount: z.number().int().min(0).default(0),
  status: CommentStatusSchema.default(CommentStatus.APPROVED),
  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().nullable().default(null),
  deletedBy: z.string().uuid().nullable().default(null),
});

// =====================================================
// DTOs
// =====================================================

/**
 * Create Comment DTO
 */
export const CreateCommentDtoSchema = z.object({
  postId: z.string().uuid(),
  content: CommentContentSchema,
  parentId: z.string().uuid().optional(), // For replying
});

/**
 * Update Comment DTO (only content can be edited)
 */
export const UpdateCommentDtoSchema = z.object({
  content: CommentContentSchema,
});

/**
 * Comment Response DTO
 */
export const CommentResponseDtoSchema: z.ZodTypeAny = CommentSchema.extend({
  author: z.object({
    id: z.uuid(),
    username: z.string(),
    avatarUrl: z.url().nullable(),
  }),
  replies: z.array(z.lazy(() => CommentResponseDtoSchema)).optional(),
}).omit({
  deletedAt: true,
  deletedBy: true,
});

/**
 * Moderation Action DTO
 */
export const ModerationActionDtoSchema = z.object({
  commentId: z.string().uuid(),
  action: z.enum(['approve', 'hide', 'delete', 'flag_spam']),
  reason: z.string().max(200).optional(),
});

// =====================================================
// TYPE INFERENCE
// =====================================================

export type Comment = z.infer<typeof CommentSchema>;
export type CreateCommentDto = z.infer<typeof CreateCommentDtoSchema>;
export type UpdateCommentDto = z.infer<typeof UpdateCommentDtoSchema>;
export type CommentResponseDto = z.infer<typeof CommentResponseDtoSchema>;
export type ModerationActionDto = z.infer<typeof ModerationActionDtoSchema>;

// =====================================================
// DOMAIN LOGIC
// =====================================================

export class CommentEntity {
  // Sensitive words list (can be loaded from DB)
  private static readonly SENSITIVE_WORDS = [
    'spam',
    'scam',
    'hack',
    'casino',
    'porn',
    // Add more as needed
  ];

  constructor(private readonly props: Comment) {}

  /**
   * Create entity from persistence data
   */
  static fromPersistence(data: Comment): CommentEntity {
    return new CommentEntity(data);
  }

  /**
   * Convert entity to plain object for serialization
   */
  toJSON(): Comment {
    return { ...this.props };
  }

  // Getters
  get id(): string {
    return this.props.id;
  }

  get postId(): string {
    return this.props.postId;
  }

  get userId(): string {
    return this.props.userId;
  }

  get parentId(): string | null {
    return this.props.parentId;
  }

  get content(): string {
    return this.props.content;
  }

  get status(): string {
    return this.props.status;
  }

  get isFlagged(): boolean {
    return this.props.isFlagged;
  }

  get likeCount(): number {
    return this.props.likeCount ?? 0;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  get deletedAt(): Date | null {
    return this.props.deletedAt;
  }

  get deletedBy(): string | null {
    return this.props.deletedBy;
  }

  // Business Rules

  /**
   * Check if this is a top-level comment (not a reply)
   */
  isTopLevel(): boolean {
    return this.props.parentId === null;
  }

  /**
   * Check if this is a reply
   */
  isReply(): boolean {
    return this.props.parentId !== null;
  }

  /**
   * BR-03: Check for sensitive words in content
   */
  static hasSensitiveWords(content: string): boolean {
    const lowerContent = content.toLowerCase();
    return CommentEntity.SENSITIVE_WORDS.some((word) =>
      lowerContent.includes(word)
    );
  }

  /**
   * Flag comment for review (if contains sensitive words)
   */
  flagForReview(): void {
    this.props.isFlagged = true;
    this.props.status = CommentStatus.PENDING_REVIEW;
  }

  /**
   * Approve comment
   */
  approve(): void {
    this.props.status = CommentStatus.APPROVED;
    this.props.isFlagged = false;
  }

  /**
   * Hide comment (moderation)
   */
  hide(): void {
    this.props.status = CommentStatus.HIDDEN;
  }

  /**
   * Soft delete comment
   */
  softDelete(deletedBy: string): void {
    this.props.deletedAt = new Date();
    this.props.deletedBy = deletedBy;
  }

  /**
   * Check if comment is deleted
   */
  isDeleted(): boolean {
    return this.props.deletedAt !== null;
  }

  /**
   * Check if comment is visible to users
   */
  isVisible(): boolean {
    return !this.isDeleted() && this.props.status === CommentStatus.APPROVED;
  }

  /**
   * Check if user can edit this comment (must be author, within 5 minutes)
   */
  canBeEditedBy(userId: string): boolean {
    if (this.props.userId !== userId) return false;

    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return this.props.createdAt > fiveMinutesAgo;
  }

  /**
   * Validate that reply is not a reply-to-reply (BR-03: 1-level only)
   */
  static async validateReplyDepth(
    parentId: string,
    getParentComment: (id: string) => Promise<Comment | null>
  ): Promise<void> {
    const parent = await getParentComment(parentId);

    if (parent && parent.parentId !== null) {
      throw new Error(
        'Cannot reply to a reply. Only 1-level comments allowed.'
      );
    }
  }
}
