import { z } from 'zod';
/**
 * Post Entity - Blog post with rich content
 */
export declare const PostStatus: {
    readonly DRAFT: "draft";
    readonly PUBLISHED: "published";
    readonly ARCHIVED: "archived";
};
export declare const PostVisibility: {
    readonly PUBLIC: "public";
    readonly PRIVATE: "private";
    readonly UNLISTED: "unlisted";
};
export declare const PostSchema: z.ZodObject<{
    id: z.ZodString;
    authorId: z.ZodString;
    title: z.ZodString;
    slug: z.ZodString;
    content: z.ZodString;
    excerpt: z.ZodDefault<z.ZodNullable<z.ZodString>>;
    featuredImageUrl: z.ZodDefault<z.ZodNullable<z.ZodString>>;
    videoId: z.ZodDefault<z.ZodNullable<z.ZodString>>;
    status: z.ZodDefault<z.ZodEnum<{
        draft: "draft";
        published: "published";
        archived: "archived";
    }>>;
    visibility: z.ZodDefault<z.ZodEnum<{
        public: "public";
        private: "private";
        unlisted: "unlisted";
    }>>;
    viewCount: z.ZodDefault<z.ZodNumber>;
    likeCount: z.ZodDefault<z.ZodNumber>;
    commentCount: z.ZodDefault<z.ZodNumber>;
    bookmarkCount: z.ZodDefault<z.ZodNumber>;
    embedding: z.ZodDefault<z.ZodNullable<z.ZodArray<z.ZodNumber>>>;
    publishedAt: z.ZodDefault<z.ZodNullable<z.ZodDate>>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
    deletedAt: z.ZodDefault<z.ZodNullable<z.ZodDate>>;
}, z.core.$strip>;
/**
 * Create Post DTO
 */
export declare const CreatePostDtoSchema: z.ZodObject<{
    title: z.ZodString;
    content: z.ZodString;
    excerpt: z.ZodOptional<z.ZodDefault<z.ZodNullable<z.ZodString>>>;
    featuredImageUrl: z.ZodOptional<z.ZodString>;
    categoryIds: z.ZodArray<z.ZodString>;
    tagIds: z.ZodArray<z.ZodString>;
    videoId: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodEnum<{
        draft: "draft";
        published: "published";
        archived: "archived";
    }>>;
    visibility: z.ZodOptional<z.ZodEnum<{
        public: "public";
        private: "private";
        unlisted: "unlisted";
    }>>;
}, z.core.$strip>;
/**
 * Update Post DTO
 */
export declare const UpdatePostDtoSchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    content: z.ZodOptional<z.ZodString>;
    excerpt: z.ZodOptional<z.ZodDefault<z.ZodNullable<z.ZodString>>>;
    featuredImageUrl: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    categoryIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
    tagIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
    status: z.ZodOptional<z.ZodEnum<{
        draft: "draft";
        published: "published";
        archived: "archived";
    }>>;
    visibility: z.ZodOptional<z.ZodEnum<{
        public: "public";
        private: "private";
        unlisted: "unlisted";
    }>>;
}, z.core.$strip>;
/**
 * Post Response DTO (with relations)
 */
export declare const PostResponseDtoSchema: z.ZodObject<{
    id: z.ZodString;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
    title: z.ZodString;
    slug: z.ZodString;
    content: z.ZodString;
    excerpt: z.ZodDefault<z.ZodNullable<z.ZodString>>;
    authorId: z.ZodString;
    featuredImageUrl: z.ZodDefault<z.ZodNullable<z.ZodString>>;
    videoId: z.ZodDefault<z.ZodNullable<z.ZodString>>;
    status: z.ZodDefault<z.ZodEnum<{
        draft: "draft";
        published: "published";
        archived: "archived";
    }>>;
    visibility: z.ZodDefault<z.ZodEnum<{
        public: "public";
        private: "private";
        unlisted: "unlisted";
    }>>;
    viewCount: z.ZodDefault<z.ZodNumber>;
    likeCount: z.ZodDefault<z.ZodNumber>;
    commentCount: z.ZodDefault<z.ZodNumber>;
    bookmarkCount: z.ZodDefault<z.ZodNumber>;
    publishedAt: z.ZodDefault<z.ZodNullable<z.ZodDate>>;
    author: z.ZodObject<{
        id: z.ZodString;
        username: z.ZodString;
        fullName: z.ZodNullable<z.ZodString>;
        avatarUrl: z.ZodNullable<z.ZodString>;
    }, z.core.$strip>;
    categories: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        slug: z.ZodString;
    }, z.core.$strip>>;
    tags: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        slug: z.ZodString;
    }, z.core.$strip>>;
}, z.core.$strip>;
/**
 * Post Feed DTO (summary for lists)
 */
export declare const PostFeedDtoSchema: z.ZodObject<{
    id: z.ZodString;
    title: z.ZodString;
    slug: z.ZodString;
    excerpt: z.ZodDefault<z.ZodNullable<z.ZodString>>;
    featuredImageUrl: z.ZodDefault<z.ZodNullable<z.ZodString>>;
    status: z.ZodDefault<z.ZodEnum<{
        draft: "draft";
        published: "published";
        archived: "archived";
    }>>;
    viewCount: z.ZodDefault<z.ZodNumber>;
    likeCount: z.ZodDefault<z.ZodNumber>;
    commentCount: z.ZodDefault<z.ZodNumber>;
    publishedAt: z.ZodDefault<z.ZodNullable<z.ZodDate>>;
    author: z.ZodObject<{
        username: z.ZodString;
        avatarUrl: z.ZodNullable<z.ZodString>;
    }, z.core.$strip>;
    categories: z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        slug: z.ZodString;
    }, z.core.$strip>>;
}, z.core.$strip>;
export type Post = z.infer<typeof PostSchema>;
export type PostStatus = (typeof PostStatus)[keyof typeof PostStatus];
export type PostVisibility = (typeof PostVisibility)[keyof typeof PostVisibility];
export type PostCreate = Pick<Post, 'authorId' | 'title' | 'content'> & {
    excerpt?: string | null;
    featuredImageUrl?: string | null;
    videoId?: string | null;
    status?: PostStatus;
    visibility?: PostVisibility;
};
export type PostUpdate = Partial<Pick<Post, 'title' | 'content' | 'excerpt' | 'featuredImageUrl' | 'videoId' | 'status' | 'visibility'>>;
export type CreatePostDto = z.infer<typeof CreatePostDtoSchema>;
export type UpdatePostDto = z.infer<typeof UpdatePostDtoSchema>;
export type PostResponseDto = z.infer<typeof PostResponseDtoSchema>;
export type PostFeedDto = z.infer<typeof PostFeedDtoSchema>;
export declare class PostEntity {
    private readonly props;
    constructor(props: Post);
    get id(): string;
    get authorId(): string;
    get title(): string;
    get slug(): string;
    get status(): string;
    get visibility(): string;
    get isPublished(): boolean;
    static create(data: PostCreate): PostEntity;
    /**
     * Check if post is public
     */
    isPublic(): boolean;
    /**
     * BR-03: Check if title is unique (implemented at repository level)
     * This method prepares slug from title
     */
    static generateSlug(title: string): string;
    /**
     * Generate excerpt from content (if not provided)
     */
    static generateExcerpt(content: string, maxLength?: number): string;
    /**
     * Publish post (set status and timestamp)
     */
    publish(): void;
    /**
     * Unpublish post (back to draft)
     */
    unpublish(): void;
    /**
     * Archive post
     */
    archive(): void;
    /**
     * Update post
     */
    update(data: PostUpdate): void;
    /**
     * Set embedding vector
     */
    setEmbedding(embedding: number[]): void;
    /**
     * Increment view count
     */
    incrementViewCount(): void;
    /**
     * Increment like count
     */
    incrementLikeCount(): void;
    /**
     * Decrement like count
     */
    decrementLikeCount(): void;
    /**
     * Increment comment count
     */
    incrementCommentCount(): void;
    /**
     * Decrement comment count
     */
    decrementCommentCount(): void;
    /**
     * Increment view count (alias)
     */
    incrementViews(): void;
    /**
     * Soft delete
     */
    softDelete(): void;
    /**
     * Check if deleted (soft delete)
     */
    isDeleted(): boolean;
    /**
     * Check if content changed significantly (for re-embedding)
     * BR-05: Re-generate embedding if content changes > 20%
     */
    hasContentChangedSignificantly(newContent: string): boolean;
    /**
     * Serialize to JSON
     */
    toJSON(): Post;
    /**
     * Serialize to summary (for feed/list)
     */
    toSummary(): {
        id: string;
        authorId: string;
        title: string;
        slug: string;
        excerpt: string | null;
        featuredImageUrl: string | null;
        status: "draft" | "published" | "archived";
        visibility: "public" | "private" | "unlisted";
        viewCount: number;
        likeCount: number;
        commentCount: number;
        bookmarkCount: number;
        publishedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
    };
}
//# sourceMappingURL=post.entity.d.ts.map