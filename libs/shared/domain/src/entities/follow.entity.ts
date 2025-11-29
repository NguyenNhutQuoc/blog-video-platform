import { z } from 'zod';

/**
 * Follow Entity - User follow relationships
 *
 * Represents a follow relationship between two users.
 */

// =====================================================
// ENTITY SCHEMA
// =====================================================

export const FollowSchema = z.object({
  id: z.string().uuid(),
  followerId: z.string().uuid(),
  followingId: z.string().uuid(),
  createdAt: z.date(),
});

// =====================================================
// DTOs
// =====================================================

export const FollowResponseDtoSchema = z.object({
  id: z.string().uuid(),
  followerId: z.string().uuid(),
  followingId: z.string().uuid(),
  createdAt: z.date(),
  follower: z
    .object({
      id: z.string().uuid(),
      username: z.string(),
      fullName: z.string().nullable(),
      avatarUrl: z.string().url().nullable(),
    })
    .optional(),
  following: z
    .object({
      id: z.string().uuid(),
      username: z.string(),
      fullName: z.string().nullable(),
      avatarUrl: z.string().url().nullable(),
    })
    .optional(),
});

export const FollowUserSummarySchema = z.object({
  id: z.string().uuid(),
  username: z.string(),
  fullName: z.string().nullable(),
  avatarUrl: z.string().url().nullable(),
  bio: z.string().nullable(),
  isFollowing: z.boolean().optional(),
  followerCount: z.number().optional(),
});

// =====================================================
// TYPE INFERENCE
// =====================================================

export type Follow = z.infer<typeof FollowSchema>;
export type FollowCreate = {
  followerId: string;
  followingId: string;
};
export type FollowResponseDto = z.infer<typeof FollowResponseDtoSchema>;
export type FollowUserSummary = z.infer<typeof FollowUserSummarySchema>;

// =====================================================
// DOMAIN LOGIC
// =====================================================

export class FollowEntity {
  constructor(private readonly props: Follow) {}

  // Getters
  get id(): string {
    return this.props.id;
  }

  get followerId(): string {
    return this.props.followerId;
  }

  get followingId(): string {
    return this.props.followingId;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  // Factory method
  static create(data: FollowCreate): FollowEntity {
    // Business rule: Cannot follow yourself
    if (data.followerId === data.followingId) {
      throw new Error('Cannot follow yourself');
    }

    const follow: Follow = {
      id: crypto.randomUUID(),
      followerId: data.followerId,
      followingId: data.followingId,
      createdAt: new Date(),
    };

    // Validate
    FollowSchema.parse(follow);

    return new FollowEntity(follow);
  }

  /**
   * Reconstitute from persistence
   */
  static fromPersistence(data: Follow): FollowEntity {
    return new FollowEntity(data);
  }

  // Serialization

  /**
   * Serialize to JSON
   */
  toJSON(): Follow {
    return { ...this.props };
  }
}
