import { z } from 'zod';
/**
 * Bookmark Entity - Saved posts by users
 *
 * Represents a bookmark action from a user on a post.
 * Bookmarks can be organized into folders.
 */
export declare const BookmarkSchema: z.ZodObject<{
    id: z.ZodString;
    userId: z.ZodString;
    postId: z.ZodString;
    folderId: z.ZodDefault<z.ZodNullable<z.ZodString>>;
    note: z.ZodDefault<z.ZodNullable<z.ZodString>>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, z.core.$strip>;
export declare const CreateBookmarkDtoSchema: z.ZodObject<{
    postId: z.ZodString;
    folderId: z.ZodOptional<z.ZodString>;
    note: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const UpdateBookmarkDtoSchema: z.ZodObject<{
    folderId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    note: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, z.core.$strip>;
export declare const BookmarkResponseDtoSchema: z.ZodObject<{
    id: z.ZodString;
    userId: z.ZodString;
    postId: z.ZodString;
    folderId: z.ZodDefault<z.ZodNullable<z.ZodString>>;
    note: z.ZodDefault<z.ZodNullable<z.ZodString>>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
    post: z.ZodOptional<z.ZodObject<{
        id: z.ZodString;
        title: z.ZodString;
        slug: z.ZodString;
        excerpt: z.ZodNullable<z.ZodString>;
        featuredImageUrl: z.ZodNullable<z.ZodString>;
    }, z.core.$strip>>;
    folder: z.ZodOptional<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        color: z.ZodNullable<z.ZodString>;
    }, z.core.$strip>>;
}, z.core.$strip>;
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
export declare class BookmarkEntity {
    private readonly props;
    constructor(props: Bookmark);
    get id(): string;
    get userId(): string;
    get postId(): string;
    get folderId(): string | null;
    get note(): string | null;
    get createdAt(): Date;
    get updatedAt(): Date;
    static create(data: BookmarkCreate): BookmarkEntity;
    /**
     * Reconstitute from persistence
     */
    static fromPersistence(data: Bookmark): BookmarkEntity;
    /**
     * Move bookmark to a different folder
     */
    moveToFolder(folderId: string | null): void;
    /**
     * Update bookmark note
     */
    updateNote(note: string | null): void;
    /**
     * Update bookmark
     */
    update(data: BookmarkUpdate): void;
    /**
     * Serialize to JSON
     */
    toJSON(): Bookmark;
}
//# sourceMappingURL=bookmark.entity.d.ts.map