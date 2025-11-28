import { z } from 'zod';

/**
 * Like Entity - Post likes by users
 *
 * Represents a like action from a user on a post.
 * Simple entity with no complex business logic.
 */

// =====================================================
// ENTITY SCHEMA
// =====================================================

export const LikeSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  postId: z.string().uuid(),
  createdAt: z.date(),
});

// =====================================================
// DTOs
// =====================================================

export const CreateLikeDtoSchema = z.object({
  userId: z.string().uuid(),
  postId: z.string().uuid(),
});

export const LikeResponseDtoSchema = LikeSchema.extend({
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

export type Like = z.infer<typeof LikeSchema>;
export type LikeCreate = {
  userId: string;
  postId: string;
};
export type CreateLikeDto = z.infer<typeof CreateLikeDtoSchema>;
export type LikeResponseDto = z.infer<typeof LikeResponseDtoSchema>;

// =====================================================
// DOMAIN LOGIC
// =====================================================

export class LikeEntity {
  constructor(private readonly props: Like) {}

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

  get createdAt(): Date {
    return this.props.createdAt;
  }

  // Factory method
  static create(data: LikeCreate): LikeEntity {
    const like: Like = {
      id: crypto.randomUUID(),
      userId: data.userId,
      postId: data.postId,
      createdAt: new Date(),
    };

    // Validate
    LikeSchema.parse(like);

    return new LikeEntity(like);
  }

  /**
   * Reconstitute from persistence
   */
  static fromPersistence(data: Like): LikeEntity {
    return new LikeEntity(data);
  }

  // Serialization

  /**
   * Serialize to JSON
   */
  toJSON(): Like {
    return { ...this.props };
  }
}
