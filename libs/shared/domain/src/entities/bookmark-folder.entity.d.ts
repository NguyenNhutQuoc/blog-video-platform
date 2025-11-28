import { z } from 'zod';
export declare const BookmarkFolderSchema: z.ZodObject<{
    id: z.ZodString;
    userId: z.ZodString;
    name: z.ZodString;
    description: z.ZodDefault<z.ZodNullable<z.ZodString>>;
    color: z.ZodDefault<z.ZodNullable<z.ZodString>>;
    sortOrder: z.ZodDefault<z.ZodNumber>;
    isDefault: z.ZodDefault<z.ZodBoolean>;
    bookmarkCount: z.ZodDefault<z.ZodNumber>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, z.core.$strip>;
export declare const CreateBookmarkFolderDtoSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    color: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const UpdateBookmarkFolderDtoSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    color: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    sortOrder: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>;
export type BookmarkFolder = z.infer<typeof BookmarkFolderSchema>;
export type BookmarkFolderCreate = {
    userId: string;
    name: string;
    description?: string | null;
    color?: string | null;
    isDefault?: boolean;
};
export type BookmarkFolderUpdate = Partial<Pick<BookmarkFolder, 'name' | 'description' | 'color' | 'sortOrder'>>;
export type CreateBookmarkFolderDto = z.infer<typeof CreateBookmarkFolderDtoSchema>;
export type UpdateBookmarkFolderDto = z.infer<typeof UpdateBookmarkFolderDtoSchema>;
export declare class BookmarkFolderEntity {
    private readonly props;
    constructor(props: BookmarkFolder);
    get id(): string;
    get userId(): string;
    get name(): string;
    get description(): string | null;
    get color(): string | null;
    get sortOrder(): number;
    get isDefault(): boolean;
    get bookmarkCount(): number;
    static create(data: BookmarkFolderCreate): BookmarkFolderEntity;
    /**
     * Reconstitute from persistence
     */
    static fromPersistence(data: BookmarkFolder): BookmarkFolderEntity;
    /**
     * Create default folder for user
     */
    static createDefault(userId: string): BookmarkFolderEntity;
    /**
     * Check if folder can be deleted
     * Default folder cannot be deleted
     */
    canBeDeleted(): boolean;
    /**
     * Check if folder is empty
     */
    isEmpty(): boolean;
    /**
     * Update folder details
     */
    update(data: BookmarkFolderUpdate): void;
    /**
     * Rename folder
     */
    rename(newName: string): void;
    /**
     * Increment bookmark count
     */
    incrementBookmarkCount(): void;
    /**
     * Decrement bookmark count
     */
    decrementBookmarkCount(): void;
    /**
     * Serialize to JSON
     */
    toJSON(): BookmarkFolder;
    /**
     * Serialize for sidebar/list
     */
    toListItem(): {
        id: string;
        name: string;
        color: string | null;
        count: number;
    };
}
//# sourceMappingURL=bookmark-folder.entity.d.ts.map