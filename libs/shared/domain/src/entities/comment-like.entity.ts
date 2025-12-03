import { z } from 'zod';

/**
 * Comment Like Entity - Comment likes by users
 *
 * Represents a like action from a user on a comment.
 * Simple entity with no complex business logic.
 */

// =====================================================
// ENTITY SCHEMA
// =====================================================

export const CommentLikeSchema = z.object({
  userId: z.string().uuid(),
  commentId: z.string().uuid(),
  createdAt: z.date(),
});

// =====================================================
// DTOs
// =====================================================

export const CreateCommentLikeDtoSchema = z.object({
  userId: z.string().uuid(),
  commentId: z.string().uuid(),
});

export const CommentLikeResponseDtoSchema = CommentLikeSchema.extend({
  user: z
    .object({
      id: z.string().uuid(),
      username: z.string(),
      avatarUrl: z.string().url().nullable(),
    })
    .optional(),
});

// =====================================================
// TYPE INFERENCE
// =====================================================

export type CommentLike = z.infer<typeof CommentLikeSchema>;
export type CommentLikeCreate = {
  userId: string;
  commentId: string;
};
export type CreateCommentLikeDto = z.infer<typeof CreateCommentLikeDtoSchema>;
export type CommentLikeResponseDto = z.infer<
  typeof CommentLikeResponseDtoSchema
>;

// =====================================================
// DOMAIN LOGIC
// =====================================================

export class CommentLikeEntity {
  constructor(private readonly props: CommentLike) {}

  // Getters
  get userId(): string {
    return this.props.userId;
  }

  get commentId(): string {
    return this.props.commentId;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  // Factory method
  static create(data: CommentLikeCreate): CommentLikeEntity {
    const like: CommentLike = {
      userId: data.userId,
      commentId: data.commentId,
      createdAt: new Date(),
    };

    // Validate
    CommentLikeSchema.parse(like);

    return new CommentLikeEntity(like);
  }

  /**
   * Reconstitute from persistence
   */
  static fromPersistence(data: CommentLike): CommentLikeEntity {
    return new CommentLikeEntity(data);
  }

  // Serialization

  /**
   * Serialize to JSON
   */
  toJSON(): CommentLike {
    return { ...this.props };
  }
}
