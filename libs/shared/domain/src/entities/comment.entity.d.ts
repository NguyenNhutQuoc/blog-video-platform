import { z } from 'zod';
/**
 * Comment Entity - Blog post comments with 1-level reply
 */
export declare const CommentStatus: {
    readonly APPROVED: "approved";
    readonly PENDING_REVIEW: "pending_review";
    readonly HIDDEN: "hidden";
};
export declare const CommentSchema: z.ZodObject<{
    id: z.ZodString;
    postId: z.ZodString;
    userId: z.ZodString;
    parentId: z.ZodDefault<z.ZodNullable<z.ZodString>>;
    content: z.ZodString;
    isFlagged: z.ZodDefault<z.ZodBoolean>;
    status: z.ZodDefault<z.ZodEnum<{
        approved: "approved";
        pending_review: "pending_review";
        hidden: "hidden";
    }>>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
    deletedAt: z.ZodDefault<z.ZodNullable<z.ZodDate>>;
    deletedBy: z.ZodDefault<z.ZodNullable<z.ZodString>>;
}, z.core.$strip>;
/**
 * Create Comment DTO
 */
export declare const CreateCommentDtoSchema: z.ZodObject<{
    postId: z.ZodString;
    content: z.ZodString;
    parentId: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
/**
 * Update Comment DTO (only content can be edited)
 */
export declare const UpdateCommentDtoSchema: z.ZodObject<{
    content: z.ZodString;
}, z.core.$strip>;
/**
 * Comment Response DTO
 */
export declare const CommentResponseDtoSchema: z.ZodTypeAny;
/**
 * Moderation Action DTO
 */
export declare const ModerationActionDtoSchema: z.ZodObject<{
    commentId: z.ZodString;
    action: z.ZodEnum<{
        approve: "approve";
        hide: "hide";
        delete: "delete";
        flag_spam: "flag_spam";
    }>;
    reason: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type Comment = z.infer<typeof CommentSchema>;
export type CreateCommentDto = z.infer<typeof CreateCommentDtoSchema>;
export type UpdateCommentDto = z.infer<typeof UpdateCommentDtoSchema>;
export type CommentResponseDto = z.infer<typeof CommentResponseDtoSchema>;
export type ModerationActionDto = z.infer<typeof ModerationActionDtoSchema>;
export declare class CommentEntity {
    private readonly props;
    private static readonly SENSITIVE_WORDS;
    constructor(props: Comment);
    get id(): string;
    get postId(): string;
    get userId(): string;
    get parentId(): string | null;
    get content(): string;
    get status(): string;
    get isFlagged(): boolean;
    /**
     * Check if this is a top-level comment (not a reply)
     */
    isTopLevel(): boolean;
    /**
     * Check if this is a reply
     */
    isReply(): boolean;
    /**
     * BR-03: Check for sensitive words in content
     */
    static hasSensitiveWords(content: string): boolean;
    /**
     * Flag comment for review (if contains sensitive words)
     */
    flagForReview(): void;
    /**
     * Approve comment
     */
    approve(): void;
    /**
     * Hide comment (moderation)
     */
    hide(): void;
    /**
     * Soft delete comment
     */
    softDelete(deletedBy: string): void;
    /**
     * Check if comment is deleted
     */
    isDeleted(): boolean;
    /**
     * Check if comment is visible to users
     */
    isVisible(): boolean;
    /**
     * Check if user can edit this comment (must be author, within 5 minutes)
     */
    canBeEditedBy(userId: string): boolean;
    /**
     * Validate that reply is not a reply-to-reply (BR-03: 1-level only)
     */
    static validateReplyDepth(parentId: string, getParentComment: (id: string) => Promise<Comment | null>): Promise<void>;
}
//# sourceMappingURL=comment.entity.d.ts.map