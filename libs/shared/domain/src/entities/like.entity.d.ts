import { z } from 'zod';
/**
 * Like Entity - Post likes by users
 *
 * Represents a like action from a user on a post.
 * Simple entity with no complex business logic.
 */
export declare const LikeSchema: z.ZodObject<{
    id: z.ZodString;
    userId: z.ZodString;
    postId: z.ZodString;
    createdAt: z.ZodDate;
}, z.core.$strip>;
export declare const CreateLikeDtoSchema: z.ZodObject<{
    userId: z.ZodString;
    postId: z.ZodString;
}, z.core.$strip>;
export declare const LikeResponseDtoSchema: z.ZodObject<{
    id: z.ZodString;
    userId: z.ZodString;
    postId: z.ZodString;
    createdAt: z.ZodDate;
    user: z.ZodOptional<z.ZodObject<{
        id: z.ZodString;
        username: z.ZodString;
        avatarUrl: z.ZodNullable<z.ZodString>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export type Like = z.infer<typeof LikeSchema>;
export type LikeCreate = {
    userId: string;
    postId: string;
};
export type CreateLikeDto = z.infer<typeof CreateLikeDtoSchema>;
export type LikeResponseDto = z.infer<typeof LikeResponseDtoSchema>;
export declare class LikeEntity {
    private readonly props;
    constructor(props: Like);
    get id(): string;
    get userId(): string;
    get postId(): string;
    get createdAt(): Date;
    static create(data: LikeCreate): LikeEntity;
    /**
     * Reconstitute from persistence
     */
    static fromPersistence(data: Like): LikeEntity;
    /**
     * Serialize to JSON
     */
    toJSON(): Like;
}
//# sourceMappingURL=like.entity.d.ts.map